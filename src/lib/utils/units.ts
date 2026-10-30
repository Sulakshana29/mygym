import { Unit } from '@/types';

const KG_TO_LB_FACTOR = 2.20462262185;

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB_FACTOR;
}

export function lbToKg(lb: number): number {
  return lb / KG_TO_LB_FACTOR;
}

export function toDisplayWeight(weightInKg: number, unit: Unit): number {
  if (unit === 'lb') {
    const val = kgToLb(weightInKg);
    return Math.round(val * 10) / 10;
  }
  return Math.round(weightInKg * 10) / 10;
}

export function fromDisplayWeight(displayVal: number, unit: Unit): number {
  if (unit === 'lb') {
    return Math.round(lbToKg(displayVal) * 100) / 100;
  }
  return Math.round(displayVal * 100) / 100;
}

export function formatWeight(
  weightInKg: number,
  unit: Unit,
  showUnit: boolean = true
): string {
  const display = toDisplayWeight(weightInKg, unit);
  const formatted = Number.isInteger(display) ? display.toString() : display.toFixed(1);
  return showUnit ? `${formatted} ${unit}` : formatted;
}
