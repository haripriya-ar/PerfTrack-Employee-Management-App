import api from '../api/client';

export async function downloadAuthFile(endpoint, filename) {
  try {
    const response = await api.get(endpoint, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: response.headers['content-type'],
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.target = '_blank';

    document.body.appendChild(link);

    setTimeout(() => {
      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    }, 100);

    return true;

  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
}

export const downloadCSVReport = async (endpoint, filename) => {
  return await downloadAuthFile(
    endpoint,
    filename || 'export.csv'
  );
};

export const downloadPDFReport = async (endpoint, filename) => {
  return await downloadAuthFile(
    endpoint,
    filename || 'report.pdf'
  );
};