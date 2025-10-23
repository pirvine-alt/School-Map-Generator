import { SchoolStatus } from './types';

// IMPORTANT: This URL uses a direct export link which is more reliable for fetching data.
export const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1PgcEmFohX6nwRZsMWLFRsa_JyjgXCrUIO9x-WdxMxvQ/export?format=csv&gid=0';

// Map settings
export const MAP_CENTER = { lat: 40.7128, lng: -74.0060 }; // Centered on NYC
export const MAP_ZOOM = 11;

// Marker icons for different statuses
export const MARKER_ICONS: Record<SchoolStatus, string> = {
  [SchoolStatus.Defined]: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  [SchoolStatus.Pending]: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  [SchoolStatus.NoService]: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
};

// Column names expected in the CSV file from Google Sheets.
// Adjust these if your column headers are different.
export const CSV_COLUMN_NAMES = {
    NAME: 'School Name',
    ADDRESS: 'Street Address',
    CITY: 'City',
    STATE: 'State',
    ZIP_CODE: 'Zip Code',
    LATITUDE: 'Latitude',
    LONGITUDE: 'Longitude',
    STATUS: 'Status',
    ADMINISTRATIVE_DESIGNATION: 'Administrative Designation',
    DISTRICT: 'District',
};