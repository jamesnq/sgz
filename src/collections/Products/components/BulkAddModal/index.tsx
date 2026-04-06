'use client'

import React, { useRef, useState } from 'react'
import { toast } from 'react-toastify'

export const BulkAddModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Thêm sản phẩm thành công!')
        onClose()
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error(data.message || 'Có lỗi xảy ra!')
      }
    } catch (error) {
      toast.error('Lỗi kết nối đên server!')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-auto py-10">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded shadow-lg max-w-lg w-full relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-black dark:hover:text-white"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 dark:text-white">Thêm sản phẩm hàng loạt</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Vui lòng tải lên file Excel (.xlsx) gồm 2 sheet: <b>Products</b> và <b>Variants</b> đúng chuẩn để nhập hàng loạt.
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded mb-6 text-sm text-blue-800 dark:text-blue-200">
          <p className="font-semibold mb-1">Mẹo viết Description:</p>
          <p>Bạn có thể sử dụng Markdown tại cột `description`:</p>
          <ul className="list-disc ml-5 mt-1 opacity-90">
            <li><code>## Tiêu đề</code> cho Header 2</li>
            <li><code>**Chữ đậm**</code> cho phần in đậm</li>
            <li><code>- Danh sách</code> cho gạch đầu dòng</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <input 
            type="file" 
            accept=".xlsx" 
            ref={fileInputRef} 
            onChange={handleUpload}
            disabled={uploading}
            className="border p-2 rounded dark:border-zinc-700 dark:text-white"
          />
          {uploading && <p className="text-sm text-blue-500 font-semibold animate-pulse">Đang tải và xử lý dữ liệu... Vui lòng không đóng cửa sổ.</p>}
          <a 
            href="/api/products/bulk/template" 
            className="text-blue-500 hover:text-blue-600 underline text-sm font-medium mt-2"
          >
            ↓ Tải xuống File Excel Mẫu
          </a>
        </div>
      </div>
    </div>
  )
}
