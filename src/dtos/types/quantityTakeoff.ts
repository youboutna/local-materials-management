
export interface QuantityTakeoff {
  id: string;
  projectId: string;
  materialId: string;
  elementType: string;
  unit: 'm³' | 'm²' | 'm' | 'unité';
  length: number;
  width?: number;
  height?: number;
  quantity: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuantityTakeoffWithDetails extends QuantityTakeoff {
  material?: {
    id: string;
    name: string;
    unit: string;
    price_per_unit: number;
    category: string;
  } | null;
}

export interface CreateQuantityTakeoffData {
  projectId: string;
  materialId: string;
  elementType: string;
  unit: 'm³' | 'm²' | 'm' | 'unité';
  length: number;
  width?: number;
  height?: number;
  note?: string;
}

export const calculateQuantity = (
  length: number, 
  width?: number, 
  height?: number, 
  unit?: string
): number => {
  if (unit === 'm³') return length * (width ?? 1) * (height ?? 1);
  if (unit === 'm²') return length * (width ?? 1);
  if (unit === 'm') return length;
  return 1;
};
