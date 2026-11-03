/**
 * mauritania-boundary.referential — contour national de la Mauritanie.
 *
 * Dérivé du découpage officiel des 15 wilayas (jeu GeoJSON simplemaps,
 * fichier mr-wilayas.geojson fourni par l'exploitant) : union des polygones
 * puis simplification à ~2 km. Aucune coordonnée n'est inventée.
 *
 * Sert de zone d'intervention par défaut quand une source d'import
 * (ex. classeur PTBA) ne précise ni lieu ni géométrie.
 */

import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';

/** Contour national [lng, lat] — anneau extérieur unique, 122 sommets. */
export const MAURITANIA_COUNTRY_OUTLINE: ReadonlyArray<{ lng: number; lat: number }> = [
    { lng: -17.08086, lat: 20.87695 }, { lng: -16.9486, lat: 21.33282 }, { lng: -13.0286, lat: 21.34 }, { lng: -13.0932, lat: 22.49349 },
    { lng: -13.1551, lat: 22.68953 }, { lng: -13.15198, lat: 22.82062 }, { lng: -13.01522, lat: 23.01797 }, { lng: -12.61942, lat: 23.2708 },
    { lng: -12.35601, lat: 23.32189 }, { lng: -12.01877, lat: 23.46701 }, { lng: -12.01527, lat: 25.99487 }, { lng: -8.70045, lat: 25.9969 },
    { lng: -8.68235, lat: 27.28535 }, { lng: -4.82172, lat: 24.9951 }, { lng: -6.55761, lat: 24.99779 }, { lng: -6.58948, lat: 24.9689 },
    { lng: -5.62399, lat: 16.53381 }, { lng: -5.35341, lat: 16.31282 }, { lng: -5.51174, lat: 15.49346 }, { lng: -9.32932, lat: 15.49683 },
    { lng: -9.31559, lat: 15.66658 }, { lng: -9.35618, lat: 15.69409 }, { lng: -9.45035, lat: 15.58952 }, { lng: -9.42393, lat: 15.44056 },
    { lng: -9.95398, lat: 15.41994 }, { lng: -10.25857, lat: 15.46938 }, { lng: -10.37011, lat: 15.43355 }, { lng: -10.71931, lat: 15.43565 },
    { lng: -10.74685, lat: 15.34116 }, { lng: -10.82673, lat: 15.28736 }, { lng: -10.90938, lat: 15.1139 }, { lng: -11.00681, lat: 15.23969 },
    { lng: -11.25372, lat: 15.41927 }, { lng: -11.41335, lat: 15.62796 }, { lng: -11.48701, lat: 15.6374 }, { lng: -11.64339, lat: 15.52681 },
    { lng: -11.72266, lat: 15.52258 }, { lng: -11.84605, lat: 15.17581 }, { lng: -11.85757, lat: 15.06591 }, { lng: -11.81363, lat: 15.02781 },
    { lng: -11.82042, lat: 14.89999 }, { lng: -12.07041, lat: 14.73444 }, { lng: -12.13777, lat: 14.78268 }, { lng: -12.24679, lat: 14.76704 },
    { lng: -12.38248, lat: 14.84604 }, { lng: -12.4476, lat: 14.90746 }, { lng: -12.48385, lat: 15.01583 }, { lng: -12.62664, lat: 15.10242 },
    { lng: -12.71703, lat: 15.10345 }, { lng: -12.77973, lat: 15.14642 }, { lng: -12.79093, lat: 15.2163 }, { lng: -12.88788, lat: 15.25042 },
    { lng: -12.85414, lat: 15.30993 }, { lng: -12.91929, lat: 15.36597 }, { lng: -12.96209, lat: 15.50554 }, { lng: -13.08383, lat: 15.49278 },
    { lng: -13.10732, lat: 15.59428 }, { lng: -13.23782, lat: 15.62347 }, { lng: -13.22981, lat: 15.71164 }, { lng: -13.2861, lat: 15.76965 },
    { lng: -13.31613, lat: 15.92792 }, { lng: -13.43431, lat: 16.09267 }, { lng: -13.49154, lat: 16.08846 }, { lng: -13.52677, lat: 16.14562 },
    { lng: -13.66896, lat: 16.10578 }, { lng: -13.7524, lat: 16.16059 }, { lng: -13.83642, lat: 16.12096 }, { lng: -13.8839, lat: 16.19366 },
    { lng: -13.96405, lat: 16.23009 }, { lng: -13.98561, lat: 16.33994 }, { lng: -14.40362, lat: 16.65947 }, { lng: -14.49406, lat: 16.63249 },
    { lng: -14.9125, lat: 16.64067 }, { lng: -14.98303, lat: 16.68727 }, { lng: -15.1251, lat: 16.58275 }, { lng: -15.41376, lat: 16.54805 },
    { lng: -15.46747, lat: 16.57933 }, { lng: -15.5361, lat: 16.5168 }, { lng: -15.60669, lat: 16.52163 }, { lng: -15.67284, lat: 16.48134 },
    { lng: -15.89865, lat: 16.51804 }, { lng: -16.05296, lat: 16.49534 }, { lng: -16.1296, lat: 16.55413 }, { lng: -16.27522, lat: 16.52212 },
    { lng: -16.33352, lat: 16.45932 }, { lng: -16.38578, lat: 16.23428 }, { lng: -16.46152, lat: 16.18649 }, { lng: -16.54231, lat: 15.80895 },
    { lng: -16.53918, lat: 16.26724 }, { lng: -16.46769, lat: 16.49297 }, { lng: -16.45918, lat: 16.64394 }, { lng: -16.17223, lat: 17.26403 },
    { lng: -16.07935, lat: 17.54369 }, { lng: -16.02443, lat: 17.95763 }, { lng: -16.06956, lat: 18.484 }, { lng: -16.13196, lat: 18.62866 },
    { lng: -16.20543, lat: 18.98466 }, { lng: -16.28452, lat: 19.13236 }, { lng: -16.3709, lat: 19.21983 }, { lng: -16.46717, lat: 19.25929 },
    { lng: -16.53543, lat: 19.3808 }, { lng: -16.47211, lat: 19.40501 }, { lng: -16.40791, lat: 19.56683 }, { lng: -16.49109, lat: 19.72506 },
    { lng: -16.43458, lat: 19.73658 }, { lng: -16.41775, lat: 19.80616 }, { lng: -16.22355, lat: 20.0023 }, { lng: -16.26108, lat: 20.13565 },
    { lng: -16.20036, lat: 20.21984 }, { lng: -16.34786, lat: 20.41757 }, { lng: -16.39574, lat: 20.57585 }, { lng: -16.46724, lat: 20.57627 },
    { lng: -16.47538, lat: 20.67057 }, { lng: -16.52906, lat: 20.66953 }, { lng: -16.54236, lat: 20.56093 }, { lng: -16.67265, lat: 20.67757 },
    { lng: -16.67115, lat: 20.73555 }, { lng: -16.9017, lat: 21.13492 }, { lng: -16.9403, lat: 21.1329 }, { lng: -17.00121, lat: 21.04745 },
    { lng: -17.05686, lat: 20.76698 }, { lng: -17.08086, lat: 20.87695 },
];

/** Zone d'intervention par défaut : tout le territoire, adresse Nouakchott. */
export const MAURITANIA_DEFAULT_INTERVENTION_ZONE: InterventionZoneDTO = {
  type: 'polygon',
  coordinates: MAURITANIA_COUNTRY_OUTLINE.map((p) => ({ lat: p.lat, lng: p.lng })),
  label: 'Mauritanie',
  address: 'Nouakchott',
  regionCode: 'MR',
};
