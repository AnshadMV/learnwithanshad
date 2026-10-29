import { Link } from 'react-router-dom'
import { Home, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="relative">
        <span className="text-8xl block animate-bounce-gentle select-none">🏜️</span>
        <div className="w-16 h-16 rounded-3xl bg-sunny-100 flex items-center justify-center text-3xl font-arabic font-black text-brand-blue absolute -bottom-2 -right-2 shadow-lg">
          لا
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-black text-[#243247] font-display">
          Oops! Page Not Found
        </h1>
        <div className="font-arabic text-xl font-bold text-gray-500" dir="rtl">
          الصفحة غير موجودة
        </div>
        <p className="text-gray-500 text-sm">
          It looks like this path wandered off into the dunes! Let's get you back to the learning playground.
        </p>
      </div>

      <Link to="/">
        <Button variant="primary" className="flex items-center gap-2 px-8 py-3.5">
          <Home className="w-5 h-5" />
          <span>Back to Adventure Home</span>
        </Button>
      </Link>
    </div>
  )
}
