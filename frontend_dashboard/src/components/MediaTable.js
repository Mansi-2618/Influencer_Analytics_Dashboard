import { useState, useMemo } from "react";
import { FolderKanban } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function MediaTable({ media }) {
  const [sortKey, setSortKey] = useState("reach");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  // ---------- SORT LOGIC ----------
  const sortedMedia = useMemo(() => {
    const sorted = [...media].sort((a, b) => {
      const valA = a[sortKey] ?? 0;
      const valB = b[sortKey] ?? 0;

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return sorted;
  }, [media, sortKey, sortOrder]);

  // ---------- PAGINATION ----------
  const totalPages = Math.ceil(sortedMedia.length / ITEMS_PER_PAGE);

  const paginatedMedia = sortedMedia.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // ---------- SORT HANDLER ----------
  const handleSort = (key) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
    setPage(1); // reset page on sort
  };

  const arrow = (key) =>
    key === sortKey ? (sortOrder === "asc" ? " ↑" : " ↓") : "";

  return (
    <details 
      open 
      className="group rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-lg overflow-hidden"
    >
      {/* ---------- HEADER ---------- */}
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font text-white hover:bg-slate-700/30 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <FolderKanban className="w-6 h-6 text-indigo-400" strokeWidth={2.5} />
          </div>
          <span className="text-lg">Media Description Table</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-bold">
            {media.length} Posts
          </span>
          <span className="text-slate-400 transition-transform duration-200 group-open:rotate-180">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </summary>

      {/* ---------- TABLE ---------- */}
      <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
        {media.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-slate-500 text-lg mb-2">📭</div>
            <p className="text-slate-400">No media data available.</p>
          </div>
        ) : (
          <table className="min-w-full text-sm border-t border-slate-700/50">
            <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm text-slate-300 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold">Media ID</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>

                {["reach", "likes", "comments", "saves"].map((key) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-4 py-3 text-center cursor-pointer select-none hover:text-orange-400 transition-colors font-semibold group/header"
                  >
                    <div className="flex items-center justify-end gap-1">
                      {key.toUpperCase()}
                      <span className="opacity-0 group-hover/header:opacity-100 transition-opacity">
                        {arrow(key) || "↕"}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedMedia.map((m, idx) => (
                <tr
                  key={idx}
                  className={`${
                    idx % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/60"
                  } hover:bg-slate-700/50 transition-colors duration-150 border-b border-slate-700/30`}
                >
                  <td className="px-4 py-3 text-slate-400">
                    {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                  </td>

                  <td className="px-4 py-3 font-mono text-sm text-slate-400">
                    {m.media_id?.substring(0, 20)}...
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${
                      m.media_type === 'REELS' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {m.media_type}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center font-semibold text-slate-300">
                    {m.reach?.toLocaleString() || 0}
                  </td>

                  <td className="px-4 py-3 text-center text-slate-300">
                    {m.likes?.toLocaleString() || 0}
                  </td>


                  <td className="px-4 py-3 text-center text-slate-300">
                    {m.comments?.toLocaleString() || 0}
                  </td>

                  <td className="px-4 py-3 text-center text-slate-300">
                    {m.saves?.toLocaleString() || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ---------- PAGINATION CONTROLS ---------- */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50 bg-slate-900/50">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-700/50 text-white rounded-lg border border-slate-600/50 hover:bg-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              Page
            </span>
            <span className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 font-bold">
              {page}
            </span>
            <span className="text-sm text-slate-400">
              of {totalPages}
            </span>
          </div>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-slate-700/50 text-white rounded-lg border border-slate-600/50 hover:bg-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            Next →
          </button>
        </div>
      )}
    </details>
  );
}