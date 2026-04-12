'use client'

import React, { useRef, useState, useEffect } from 'react'
import { toast } from 'react-toastify'

type TaskProgress = {
  taskId: string;
  status: "running" | "completed" | "error";
  total: number;
  processed: number;
  updated: number;
  failed: number;
  rateLimited: number;
  startedAt: number;
  finishedAt: number | null;
  error?: string;
  logs?: string[];
  eta?: number;
  rate?: number;
};

export const BulkAddModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [progress, setProgress] = useState<TaskProgress | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (taskId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/progress?taskId=${taskId}`);
          if (res.ok) {
            const data: TaskProgress = await res.json();
            setProgress(data);

            if (data.status === 'completed' || data.status === 'error') {
              clearInterval(interval);
              setUploading(false);
              if (data.status === 'completed') {
                toast.success('Tiến trình nhập hàng loạt đã hoàn tất!');
              } else {
                toast.error('Tiến trình thất bại: ' + (data.error || 'Lỗi không xác định'));
              }
            }
          }
        } catch (err) {
          console.error("Lỗi khi fetch progress", err);
        }
      }, 1500); // Poll every 1.5s
    }

    return () => clearInterval(interval);
  }, [taskId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress(null)
    setTaskId(null)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.taskId) {
        toast.info(data.message || 'Đã gửi file. Đang xử lý ngầm...');
        setTaskId(data.taskId);
        // We leave uploading=true until the task is completed/error via polling
      } else {
        toast.error(data.message || 'Có lỗi xảy ra khi upload!')
        setUploading(false)
      }
    } catch (error) {
      toast.error('Lỗi kết nối đên server!')
      setUploading(false)
    }
  }

  const percent = progress && progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  const parseLogs = (logs: string[]) => {
    return logs.map((log) => {
      let severity = log.startsWith('❌') ? 'Lỗi (Error)' : log.startsWith('⚠️') ? 'Phân vân (Warn)' : 'Thông tin';
      let sevClass = log.startsWith('❌') ? 'text-red-600 bg-red-50 dark:bg-red-900/30' : log.startsWith('⚠️') ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' : 'text-blue-600 bg-blue-50 dark:bg-blue-900/30';
      
      let lineStr = '-';
      let typeStr = 'Chung';
      let msg = log.replace(/^[❌⚠️]\s*/, '');
      
      const match = msg.match(/(?:Dòng|Row)\s*(\d+)/i);
      if (match && match[1]) lineStr = match[1];
      
      if (msg.toLowerCase().includes('product') || msg.toLowerCase().includes('sản phẩm')) typeStr = 'Sản phẩm';
      else if (msg.toLowerCase().includes('variant') || msg.toLowerCase().includes('bản thể')) typeStr = 'Bản thể';
      else if (msg.toLowerCase().includes('lỗi tải ảnh')) typeStr = 'Ảnh/Media';
      
      return { severity, sevClass, line: lineStr, type: typeStr, message: msg };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-auto py-10">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded shadow-lg max-w-[90vw] md:max-w-4xl w-full relative">
        <button 
          onClick={() => {
            if (uploading && !confirm("Tiến trình đang chạy ngầm. Đóng bảng không làm hủy tiến trình, nhưng bạn sẽ không theo dõi được nữa. Vẫn đóng?")) return;
            onClose();
          }} 
          className="absolute top-4 right-4 text-gray-500 hover:text-black dark:hover:text-white"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 dark:text-white">Thêm sản phẩm hàng loạt (Bulk Import)</h2>
        {!taskId && (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Vui lòng tải lên file Excel (.xlsx) gồm 2 sheet: <b>Products</b> và <b>Variants</b> đúng chuẩn để nhập hàng loạt.
          </p>
        )}
        
        {!taskId && (
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded mb-6 text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Mẹo xử lý Ảnh (Sức mạnh 10 AI Agents):</p>
            <ul className="list-disc ml-5 mt-1 opacity-90">
              <li>Hỗ trợ tải trực tiếp từ link <strong>Google Drive</strong> (chép link view bình thường vào).</li>
              <li>Tự động vượt qua các định dạng tải ảo (octet-stream) bằng Magic Bytes Check.</li>
              <li>Chạy nền song song siêu tốc (không lo treo máy/sập web).</li>
              <li>Sản phẩm thiếu ảnh vẫn được tạo nhưng với ảnh <strong>Placeholder</strong> trong suốt để tránh lỗi Schema Database!</li>
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {!taskId && (
            <input 
              type="file" 
              accept=".xlsx" 
              ref={fileInputRef} 
              onChange={handleUpload}
              disabled={uploading}
              className="border p-2 rounded dark:border-zinc-700 dark:text-white"
            />
          )}

          {uploading && !taskId && (
            <p className="text-sm text-blue-500 font-semibold animate-pulse">Đang gửi file lên máy chủ...</p>
          )}

          {taskId && progress && (
            <div className="mt-4 border rounded p-4 dark:border-zinc-700">
               <h3 className="font-semibold mb-2 dark:text-white">
                  Tiến trình: {percent}% ({progress.processed}/{progress.total})
               </h3>
               <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 dark:bg-gray-700">
                  <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
               </div>
               <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Trạng thái: {progress.status}</span>
                  <span>Lỗi: {progress.failed}</span>
                  {progress.eta && progress.eta > 0 && progress.status === 'running' && (
                    <span>~{progress.eta.toFixed(0)} giây còn lại</span>
                  )}
               </div>

               {progress.logs && progress.logs.length > 0 && (
                 <div className="mt-4">
                   <p className="text-sm font-semibold text-red-500 mb-2">Bảng Tổng Hợp Sự Cố Import:</p>
                   <div className="bg-gray-50 dark:bg-zinc-800 rounded border dark:border-zinc-700 max-h-60 overflow-y-auto">
                     <table className="min-w-full text-xs text-left text-gray-700 dark:text-gray-300 relative">
                       <thead className="bg-gray-100 dark:bg-zinc-700 sticky top-0 shadow-sm z-10">
                         <tr>
                            <th className="px-3 py-2 font-semibold border-b dark:border-zinc-600">Dòng</th>
                            <th className="px-3 py-2 font-semibold border-b dark:border-zinc-600">Phân Loại</th>
                            <th className="px-3 py-2 font-semibold border-b dark:border-zinc-600">Mức Độ</th>
                            <th className="px-3 py-2 font-semibold border-b dark:border-zinc-600">Nguyên Nhân / Chi Tiết</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                         {parseLogs(progress.logs).map((row, idx) => (
                           <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors">
                              <td className="px-3 py-2 font-mono whitespace-nowrap">{row.line}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{row.type}</td>
                              <td className="px-3 py-2 whitespace-nowrap"><span className={`px-2 py-1 rounded font-medium ${row.sevClass}`}>{row.severity}</span></td>
                              <td className="px-3 py-2 whitespace-pre-wrap">{row.message}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               )}

               {progress.status === 'completed' && (
                 <div className="mt-4 text-center">
                    <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors">
                      Tải lại trang Payload
                    </button>
                 </div>
               )}
            </div>
          )}

          {!taskId && (
            <a 
              href="/api/products/bulk/template" 
              className="text-blue-500 hover:text-blue-600 underline text-sm font-medium mt-2"
            >
              ↓ Tải xuống File Excel Mẫu
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
