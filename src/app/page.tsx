'use client';

import { useState, FormEvent } from 'react';
import imageCompression from 'browser-image-compression';

export default function HomePage() {
  const [plates, setPlates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔤 Format Finnish license plates as ABC-123
  const formatFinnishPlate = (plate: string): string => {
    const match = plate.match(/^([A-ZÅÄÖ]{2,3})(\d{2,3})$/i);
    if (match) {
      return `${match[1].toUpperCase()}-${match[2]}`;
    }
    return plate.toUpperCase();
  };

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const files = (form.elements.namedItem('images') as HTMLInputElement).files;

    if (!files) return;

    const newPlates: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 8 * 1024 * 1024) {
        alert(`"${file.name}" is too large (max 8MB).`);
        continue;
      }

      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });

        const formData = new FormData();
        formData.append('image', compressedFile, compressedFile.name);

        const res = await fetch('/api/plate-reader', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (data.plate && Array.isArray(data.plate)) {
          data.plate.forEach((p: any) => {
            const formatted = formatFinnishPlate(p.plate);
            newPlates.push(formatted);
          });
        }

        // Avoid hitting API rate limits
        await new Promise((res) => setTimeout(res, 1100));
      } catch (err: any) {
        console.error('Error uploading file:', file.name, err.message);
        alert(`Failed to process ${file.name}: ${err.message}`);
      }
    }

    setPlates((prev) => [...prev, ...newPlates]);
    setLoading(false);
    form.reset();
  };

  const exportToCSV = () => {
    if (plates.length === 0) return;

    const header = 'License Plate\n';
    const rows = plates.join('\n');
    const csvContent = header + rows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plates.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white shadow-xl rounded-2xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          📸 License Plate Reader
        </h1>

        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            name="images"
            multiple
            accept="image/*"
            className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              loading
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing images...' : 'Upload & Detect Plates'}
          </button>
        </form>

        {plates.length > 0 && (
          <>
            <div className="flex justify-between items-center pt-4 border-t">
              <h2 className="text-lg font-semibold text-gray-700">
                Detected Plates ({plates.length})
              </h2>
              <div className="space-x-3">
                <button
                  onClick={exportToCSV}
                  className="text-sm text-green-600 hover:underline"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => setPlates([])}
                  className="text-sm text-red-600 hover:underline"
                >
                  Clear List
                </button>
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {plates.map((plate, index) => (
                <li
                  key={index}
                  className="bg-gray-100 rounded-md px-3 py-2 text-center text-lg font-mono text-gray-800 shadow-sm"
                >
                  {plate}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
