'use client';

import { useState, FormEvent } from 'react';

export default function HomePage() {
const [plates, setPlates] = useState<string[]>([]);
const [loading, setLoading] = useState(false);

const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);

  const form = e.currentTarget;
  const files = (form.elements.namedItem('images') as HTMLInputElement).files;

  if (!files) return;

  const newPlates: string[] = [];

  for (const file of Array.from(files)) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('/api/plate-reader', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (data.plate && Array.isArray(data.plate)) {
      data.plate.forEach((p: any) => {
        newPlates.push(p.plate);
      });
    }
  }

  setPlates((prev) => [...prev, ...newPlates]);
  setLoading(false);
  form.reset();
};

return (
  <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
    <div className="w-full max-w-xl bg-white shadow-xl rounded-2xl p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
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
            <button
              onClick={() => setPlates([])}
              className="text-sm text-red-600 hover:underline"
            >
              Clear List
            </button>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plates.map((plate, index) => (
              <li
                key={index}
                className="bg-gray-100 rounded-md px-3 py-2 text-center text-lg font-mono text-gray-800 shadow-sm"
              >
                {plate.toUpperCase()}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  </main>
);
}
