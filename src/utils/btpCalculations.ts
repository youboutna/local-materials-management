interface Opening {
  length: number;
  width: number;
  height?: number;
}

interface CalculationOptions {
  openings?: Opening[];
  dosage?: number;
}

export function calculateEquivalentOpening(openings: Opening[]): { length: number; width: number } {
  const totalArea = openings.reduce((sum, op) => sum + (op.length * op.width), 0);
  const maxDim = Math.max(...openings.map(op => Math.max(op.length, op.width)));
  
  return {
    length: maxDim,
    width: totalArea / maxDim
  };
}

export function calculateConcreteSlab(
  length: number,
  width: number,
  height: number,
  options?: CalculationOptions
): { [key: string]: number } {
  const dosage = options?.dosage || 350;
  let volume = length * width * height;
  
  if (options?.openings && options.openings.length > 0) {
    const equivalentOpening = calculateEquivalentOpening(options.openings);
    volume -= equivalentOpening.length * equivalentOpening.width * height;
  }
  
  const cement = volume * dosage;
  const sand = volume * 0.4 * 1.05;
  const gravel = volume * 0.8 * 1.05;
  
  return { 
    'Volume béton (m³)': volume,
    'Ciment (kg)': cement,
    'Sable (m³)': sand,
    'Gravier (m³)': gravel,
    'Sacs de ciment (50kg)': Math.ceil(cement / 50),
    'Ciment (tonnes)': cement / 1000
  };
}

export function calculateMasonryWall(
  length: number,
  height: number,
  options?: CalculationOptions
): { [key: string]: number } {
  let wallArea = length * height;
  
  if (options?.openings && options.openings.length > 0) {
    const openingsArea = options.openings.reduce((sum, op) => sum + (op.length * op.width), 0);
    wallArea -= openingsArea;
  }
  
  const numberOfBricks = wallArea * 13; // 13 briques par m²
  const mortarVolume = wallArea * 0.02; // 2cm d'épaisseur
  
  return {
    'Surface mur (m²)': wallArea,
    'Nombre de briques': Math.ceil(numberOfBricks),
    'Volume mortier (m³)': mortarVolume,
    'Ciment pour mortier (kg)': mortarVolume * 400 * 1.3
  };
}

export function calculateAdvancedQuantities(
  elementType: string,
  length: number,
  width?: number,
  height?: number,
  options?: CalculationOptions
): { [key: string]: number } {
  const results: { [key: string]: number } = {};

  switch (elementType.toLowerCase()) {
    case 'dalle béton':
      if (width && height) {
        return calculateConcreteSlab(length, width, height, options);
      }
      break;

    case 'mur maçonnerie':
      if (height) {
        return calculateMasonryWall(length, height, options);
      }
      break;

    case 'plancher corps creux':
      if (width && height) {
        const slabResult = calculateConcreteSlab(length, width, height, options);
        slabResult['Nombre entrevous'] = (length * width) * 7.2 * 1.05;
        return slabResult;
      }
      break;

    case 'ferraillage':
      if (width) {
        const surface = length * width;
        const weight = surface * (options?.dosage || 80);
        return {
          'Surface (m²)': surface,
          'Poids ferraillage (kg)': weight
        };
      }
      break;

    case 'enduit':
      if (width) {
        const surface = length * width;
        const cement = surface * (options?.dosage || 7);
        return {
          'Surface enduit (m²)': surface,
          'Ciment enduit (kg)': cement,
          'Sacs de ciment (50kg)': Math.ceil(cement / 50)
        };
      }
      break;

    default:
      if (width && height) {
        results['Volume (m³)'] = length * width * height;
      }
      if (width) {
        results['Surface (m²)'] = length * width;
      }
      results['Longueur (m)'] = length;
      if (width) results['Largeur (m)'] = width;
      if (height) results['Hauteur (m)'] = height;
      break;
  }

  return results;
}