import { School, SchoolStatus } from '../types';
import { CSV_COLUMN_NAMES } from '../constants';

// Make PapaParse available in the scope, as it's loaded from a CDN.
declare const Papa: any;

export const fetchSchoolData = async (url: string): Promise<School[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results: { data: any[] }) => {
        try {
          const parsedData = results.data.map((row, index) => {
            const lat = parseFloat(row[CSV_COLUMN_NAMES.LATITUDE]);
            const lng = parseFloat(row[CSV_COLUMN_NAMES.LONGITUDE]);

            if (isNaN(lat) || isNaN(lng)) {
              console.warn(`Skipping row ${index + 2} due to invalid latitude/longitude.`);
              return null;
            }
            
            const sheetStatus = (row[CSV_COLUMN_NAMES.STATUS] || '').trim();
            let status: SchoolStatus | null = null;

            switch (sheetStatus) {
              case 'Defined':
                status = SchoolStatus.Defined;
                break;
              case 'Pending':
                status = SchoolStatus.Pending;
                break;
              case 'No Service':
                status = SchoolStatus.NoService;
                break;
              default:
                console.warn(`Skipping row ${index + 2} due to unrecognized status: "${sheetStatus}"`);
                return null;
            }

            const street = row[CSV_COLUMN_NAMES.ADDRESS] || '';
            const city = row[CSV_COLUMN_NAMES.CITY] || '';
            const state = row[CSV_COLUMN_NAMES.STATE] || '';
            const zip = row[CSV_COLUMN_NAMES.ZIP_CODE] || '';

            // Combine address parts into a single string.
            // e.g., "123 Main St, Brooklyn, NY 11201"
            const fullAddress = [street, city, state].filter(Boolean).join(', ') + (zip ? ` ${zip}` : '');


            return {
              id: `${lat}-${lng}-${index}`,
              name: row[CSV_COLUMN_NAMES.NAME] || 'Unnamed School',
              address: fullAddress || 'No Address Provided',
              latitude: lat,
              longitude: lng,
              status: status,
              administrativeDesignation: row[CSV_COLUMN_NAMES.ADMINISTRATIVE_DESIGNATION] || 'N/A',
              district: row[CSV_COLUMN_NAMES.DISTRICT] || 'N/A',
            };
          }).filter((item): item is School => item !== null);
          resolve(parsedData);
        } catch (error) {
          reject(new Error('Failed to parse CSV data. Check column names and data format.'));
        }
      },
      error: (error: any) => {
        reject(new Error(`Could not fetch or parse CSV file from URL. ${error.message}`));
      },
    });
  });
};