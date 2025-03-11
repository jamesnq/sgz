'use client'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useTheme } from './Theme'

export const ClientProviders: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { theme } = useTheme()
  return (
    <div>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme || undefined}
      />
      {children}
    </div>
  )
}
