import React, { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import Sidebar from './components/Sidebar'
import ParticleScene from './components/ParticleScene'
import { Chapter } from './types'

const chapters: Chapter[] = [
  {
    id: 1,
    title: 'فضاء الطور والجاذبات الديناميكية',
    subtitle: 'Phase Space & Attractors',
    description: 'هذا هو المسرح الذي وُلدت فيه الفكرة. الرياضيات التقليدية تدرس الإشارة مع الزمن، أما هندسة الأنظمة فتدرس (الحالة ضد التغير). كيف نلغي محور الزمن، لنجعل المحور الأفقي هو (X_N) والعمودي هو المشتقة.'
  },
  {
    id: 2,
    title: 'الهندسة التحليلية والتحويلات الطوبولوجية',
    subtitle: 'Analytical Geometry',
    description: 'المهارة الجراحية التي نقلت المعادلة من الرياضيات النظرية إلى البرمجيات اللحظية المستقرة. الانتقال المرن بين النظام القطبي (الزوايا) والكارتيزي التعامدي.'
  },
  {
    id: 3,
    title: 'نظرية التفرع والتباطؤ الحرج',
    subtitle: 'Bifurcation Theory',
    description: 'هذه هي الفيزياء الكامنة... عندما تتضخم السعة وتتجمد الحركة ويقترب الزخم من الصفر، ينفجر الكسر جبرياً نحو المالانهاية ويخلق المنحدر المرعب.'
  },
  {
    id: 4,
    title: 'الفروق المحدودة والتحليل العددي',
    subtitle: 'Causal Finite Differences',
    description: 'كيف تحسب المشتقات لحظة بلحظة دون معرفة المستقبل؟ يضمن الحفاظ على السببية الصارمة لمنع تسريب البيانات زمنياً.'
  },
  {
    id: 5,
    title: 'علم الحسبان الكسري وقوانين الأسس',
    subtitle: 'Fractional Exponents',
    description: 'العضلات الجبرية... دمج الأسس الكسرية عبر توحيد المقامات للانتقال من كسر قطبي لسطر نظيف.'
  },
  {
    id: 6,
    title: 'الهندسة العددية والانتظام الحوسبي',
    subtitle: 'Numerical Regularization',
    description: 'الجسر الذي يعبر بالعالم الرياضي للأجهزة الحقيقية. حقن عامل الحماية إبسيلون وأس التنعيم 1.25 لمنع الانفجار وكبح ضوضاء التكميم.'
  },
  {
    id: 7,
    title: 'المُكاملات ذات الذاكرة المتلاشية',
    subtitle: 'Fading-Memory Operators',
    description: 'التكاملات الموزونة أسياً، لنسيان الماضي ومنح الثقل للأحداث الحديثة المتسارعة (ذيل التلاشي الأسي).'
  }
]

function App() {
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null)
  const [momentum, setMomentum] = useState(1.0)
  const [isRegularized, setIsRegularized] = useState(false)

  return (
    <div className="w-screen h-screen flex bg-lab-black">
      <Sidebar
        chapters={chapters}
        activeChapter={activeChapter}
        onSelectChapter={setActiveChapter}
        momentum={momentum}
        onMomentumChange={setMomentum}
        isRegularized={isRegularized}
        onRegularize={() => setIsRegularized(!isRegularized)}
      />
      <div className="flex-1 relative">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 15]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
            zoomSpeed={0.8}
            panSpeed={0.5}
          />
          <ParticleScene
            activeChapter={activeChapter}
            momentum={momentum}
            isRegularized={isRegularized}
          />
        </Canvas>
      </div>
    </div>
  )
}

export default App
