import { BodyWeightEntry } from '@/types';

/**
 * Parses Apple Health or Google Fit CSV/JSON exports to extract bodyweight & resting heart rate records.
 */
export function parseHealthExport(
  rawText: string,
  fileName: string
): {
  weights: BodyWeightEntry[];
  restingHeartRate?: number;
  message: string;
} {
  const weights: BodyWeightEntry[] = [];
  let restingHeartRate: number | undefined;

  // 1. JSON format (Custom or exported health format)
  if (fileName.endsWith('.json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(rawText);
      const list = Array.isArray(parsed) ? parsed : parsed.weights || parsed.data || [];
      list.forEach((item: any, idx: number) => {
        const date = item.date || item.startDate?.split('T')[0] || item.time?.split('T')[0];
        const val = parseFloat(item.weightKg || item.weight || item.value);
        if (date && val > 20 && val < 300) {
          weights.push({
            id: `imported-weight-${idx}-${Date.now()}`,
            date,
            weightKg: Math.round(val * 10) / 10,
            note: 'Imported from Health App',
          });
        }
      });
      if (parsed.restingHeartRate) {
        restingHeartRate = Math.round(Number(parsed.restingHeartRate));
      }
    } catch {
      // Continue to CSV attempt
    }
  }

  // 2. CSV format (Apple Health / Google Fit CSV export)
  if (weights.length === 0) {
    const lines = rawText.split(/\r?\n/);
    lines.forEach((line, idx) => {
      // Check for comma or semicolon delimited
      const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 2) {
        // Look for date pattern YYYY-MM-DD
        const datePart = parts.find((p) => /^\d{4}-\d{2}-\d{2}/.test(p));
        const numPart = parts.find((p) => /^\d+(\.\d+)?$/.test(p) && parseFloat(p) >= 30 && parseFloat(p) <= 250);

        if (datePart && numPart) {
          const date = datePart.slice(0, 10);
          const weight = parseFloat(numPart);
          if (!weights.some((w) => w.date === date)) {
            weights.push({
              id: `imported-csv-${idx}-${Date.now()}`,
              date,
              weightKg: Math.round(weight * 10) / 10,
              note: 'Imported from Health CSV',
            });
          }
        }
      }
    });
  }

  // 3. Apple Health export.xml basic search for BodyMass records
  if (weights.length === 0 && rawText.includes('HKQuantityTypeIdentifierBodyMass')) {
    const recordRegex = /<Record[^>]+type="HKQuantityTypeIdentifierBodyMass"[^>]+startDate="([^"]+)"[^>]+value="([^"]+)"/g;
    let match;
    let count = 0;
    while ((match = recordRegex.exec(rawText)) !== null && count < 100) {
      const date = match[1].slice(0, 10);
      const val = parseFloat(match[2]);
      if (date && val > 30 && val < 250) {
        weights.push({
          id: `apple-health-${count}-${Date.now()}`,
          date,
          weightKg: Math.round(val * 10) / 10,
          note: 'Apple HealthKit',
        });
        count++;
      }
    }
  }

  // Sort newest first
  weights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    weights,
    restingHeartRate,
    message: weights.length > 0 ? `Successfully imported ${weights.length} health records!` : 'No compatible bodyweight records found in file.',
  };
}

/**
 * Web Bluetooth Heart Rate Monitor Connection
 * Supported in Chrome/Edge on Android and desktop.
 */
export async function connectBluetoothHeartRate(
  onHeartRateUpdate: (bpm: number) => void
): Promise<{ disconnect: () => void; deviceName: string }> {
  if (typeof window === 'undefined' || !(navigator as any).bluetooth) {
    throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome on Android.');
  }

  const device = await (navigator as any).bluetooth.requestDevice({
    filters: [{ services: ['heart_rate'] }],
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService('heart_rate');
  const characteristic = await service.getCharacteristic('heart_rate_measurement');

  await characteristic.startNotifications();
  characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
    const value = event.target.value;
    const flags = value.getUint8(0);
    let bpm = 0;
    if ((flags & 0x01) === 0) {
      bpm = value.getUint8(1);
    } else {
      bpm = value.getUint16(1, /*littleEndian=*/ true);
    }
    onHeartRateUpdate(bpm);
  });

  return {
    deviceName: device.name || 'Bluetooth Heart Rate Monitor',
    disconnect: () => {
      try {
        device.gatt.disconnect();
      } catch {
        // ignore
      }
    },
  };
}
