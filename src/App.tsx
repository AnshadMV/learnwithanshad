import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import Layout from '@/components/layout/Layout'

// Lazy-loaded pages
const HomePage = lazy(() => import('@/pages/HomePage'))
const AlphabetPage = lazy(() => import('@/pages/AlphabetPage'))
const LetterPage = lazy(() => import('@/pages/LetterPage'))
const WordExplorerPage = lazy(() => import('@/pages/WordExplorerPage'))
const GamesLibraryPage = lazy(() => import('@/pages/GamesLibraryPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const StudentLoginPage = lazy(() => import('@/pages/StudentLoginPage'))
const TeacherLoginPage = lazy(() => import('@/pages/TeacherLoginPage'))
const StudentDashboardPage = lazy(() => import('@/pages/StudentDashboardPage'))
const TeacherDashboardPage = lazy(() => import('@/pages/TeacherDashboardPage'))
const StudentProgressPage = lazy(() => import('@/pages/StudentProgressPage'))
const TeacherStudentsPage = lazy(() => import('@/pages/TeacherStudentsPage'))
const LiveMonitorPage = lazy(() => import('@/pages/LiveMonitorPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// Games
const LetterSafariGame = lazy(() => import('@/pages/games/LetterSafariGame'))
const LetterPictureMatchGame = lazy(() => import('@/pages/games/LetterPictureMatchGame'))
const FindDifferentLetterGame = lazy(() => import('@/pages/games/FindDifferentLetterGame'))
const LetterMemoryGame = lazy(() => import('@/pages/games/LetterMemoryGame'))
const LetterDetectiveGame = lazy(() => import('@/pages/games/LetterDetectiveGame'))
const LetterBingoGame = lazy(() => import('@/pages/games/LetterBingoGame'))
const TraceLetterGame = lazy(() => import('@/pages/games/TraceLetterGame'))
const ConnectDotsGame = lazy(() => import('@/pages/games/ConnectDotsGame'))
const BuildLetterGame = lazy(() => import('@/pages/games/BuildLetterGame'))
const LetterShapeMatchGame = lazy(() => import('@/pages/games/LetterShapeMatchGame'))
const CompleteWordGame = lazy(() => import('@/pages/games/CompleteWordGame'))
const LetterPuzzleGame = lazy(() => import('@/pages/games/LetterPuzzleGame'))
const ListenAndChooseGame = lazy(() => import('@/pages/games/ListenAndChooseGame'))
const SoundSafariGame = lazy(() => import('@/pages/games/SoundSafariGame'))
const PictureHuntGame = lazy(() => import('@/pages/games/PictureHuntGame'))
const WordBuilderGame = lazy(() => import('@/pages/games/WordBuilderGame'))
const ListenAndMatchGame = lazy(() => import('@/pages/games/ListenAndMatchGame'))
const PositionGameGame = lazy(() => import('@/pages/games/PositionGame'))
const BalloonPopGame = lazy(() => import('@/pages/games/BalloonPopGame'))
const LetterFishingGame = lazy(() => import('@/pages/games/LetterFishingGame'))
const TreasureChestGame = lazy(() => import('@/pages/games/TreasureChestGame'))
const RocketRaceGame = lazy(() => import('@/pages/games/RocketRaceGame'))
const LetterCatcherGame = lazy(() => import('@/pages/games/LetterCatcherGame'))
const DailyQuestGame = lazy(() => import('@/pages/games/DailyQuestGame'))
// 22 New Games
const DesertCaravanGame = lazy(() => import('@/pages/games/DesertCaravanGame'))
const GemMinerGame = lazy(() => import('@/pages/games/GemMinerGame'))
const MagicCarpetGame = lazy(() => import('@/pages/games/MagicCarpetGame'))
const FruitBlenderGame = lazy(() => import('@/pages/games/FruitBlenderGame'))
const StarConstellationGame = lazy(() => import('@/pages/games/StarConstellationGame'))
const FrogLeapGame = lazy(() => import('@/pages/games/FrogLeapGame'))
const PirateIslandGame = lazy(() => import('@/pages/games/PirateIslandGame'))
const SubmarineSonarGame = lazy(() => import('@/pages/games/SubmarineSonarGame'))
const TrainCouplerGame = lazy(() => import('@/pages/games/TrainCouplerGame'))
const KiteFlyingGame = lazy(() => import('@/pages/games/KiteFlyingGame'))
const CastleKeymakerGame = lazy(() => import('@/pages/games/CastleKeymakerGame'))
const CookieOvenGame = lazy(() => import('@/pages/games/CookieOvenGame'))
const RaindropRhythmGame = lazy(() => import('@/pages/games/RaindropRhythmGame'))
const DolphinHoopGame = lazy(() => import('@/pages/games/DolphinHoopGame'))
const MarketBazaarGame = lazy(() => import('@/pages/games/MarketBazaarGame'))
const SolarOrbitGame = lazy(() => import('@/pages/games/SolarOrbitGame'))
const JungleVineGame = lazy(() => import('@/pages/games/JungleVineGame'))
const MosaicTileGame = lazy(() => import('@/pages/games/MosaicTileGame'))
const CritterWhackGame = lazy(() => import('@/pages/games/CritterWhackGame'))
const RainbowBridgeGame = lazy(() => import('@/pages/games/RainbowBridgeGame'))
const LanternGlowGame = lazy(() => import('@/pages/games/LanternGlowGame'))
const GearFactoryGame = lazy(() => import('@/pages/games/GearFactoryGame'))

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sky">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce-gentle">🌟</div>
        <p className="text-2xl font-bold text-brand-blue font-display">Loading...</p>
      </div>
    </div>
  )
}

function DashboardRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />
  return <Navigate to="/student/dashboard" replace />
}

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'teacher' | 'student' }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to={role === 'teacher' ? '/teacher/login' : '/student/login'} replace />
  if (profile?.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/alphabet" element={<Layout><AlphabetPage /></Layout>} />
        <Route path="/letter/:id" element={<Layout><LetterPage /></Layout>} />
        <Route path="/words" element={<Layout><WordExplorerPage /></Layout>} />
        <Route path="/games" element={<Layout><GamesLibraryPage /></Layout>} />

        {/* Auth */}
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />
        <Route path="/student/login" element={<StudentLoginPage />} />
        <Route path="/teacher/login" element={<TeacherLoginPage />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/profile" element={<DashboardRedirect />} />

        {/* Student */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute role="student"><Layout><StudentDashboardPage /></Layout></ProtectedRoute>
        } />
        <Route path="/student/progress" element={
          <ProtectedRoute role="student"><Layout><StudentProgressPage /></Layout></ProtectedRoute>
        } />

        {/* Teacher */}
        <Route path="/teacher/dashboard" element={
          <ProtectedRoute role="teacher"><Layout><TeacherDashboardPage /></Layout></ProtectedRoute>
        } />
        <Route path="/teacher/students" element={
          <ProtectedRoute role="teacher"><Layout><TeacherStudentsPage /></Layout></ProtectedRoute>
        } />
        <Route path="/teacher/live" element={
          <ProtectedRoute role="teacher"><Layout><LiveMonitorPage /></Layout></ProtectedRoute>
        } />
        <Route path="/teacher/reports" element={
          <ProtectedRoute role="teacher"><Layout><ReportsPage /></Layout></ProtectedRoute>
        } />

        {/* Settings */}
        <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />

        {/* Games */}
        <Route path="/games/letter-safari" element={<Layout><LetterSafariGame /></Layout>} />
        <Route path="/games/letter-picture-match" element={<Layout><LetterPictureMatchGame /></Layout>} />
        <Route path="/games/find-different" element={<Layout><FindDifferentLetterGame /></Layout>} />
        <Route path="/games/memory-cards" element={<Layout><LetterMemoryGame /></Layout>} />
        <Route path="/games/letter-detective" element={<Layout><LetterDetectiveGame /></Layout>} />
        <Route path="/games/letter-bingo" element={<Layout><LetterBingoGame /></Layout>} />
        <Route path="/games/trace-letter" element={<Layout><TraceLetterGame /></Layout>} />
        <Route path="/games/connect-dots" element={<Layout><ConnectDotsGame /></Layout>} />
        <Route path="/games/build-letter" element={<Layout><BuildLetterGame /></Layout>} />
        <Route path="/games/shape-match" element={<Layout><LetterShapeMatchGame /></Layout>} />
        <Route path="/games/complete-word" element={<Layout><CompleteWordGame /></Layout>} />
        <Route path="/games/letter-puzzle" element={<Layout><LetterPuzzleGame /></Layout>} />
        <Route path="/games/listen-choose" element={<Layout><ListenAndChooseGame /></Layout>} />
        <Route path="/games/sound-safari" element={<Layout><SoundSafariGame /></Layout>} />
        <Route path="/games/picture-hunt" element={<Layout><PictureHuntGame /></Layout>} />
        <Route path="/games/word-builder" element={<Layout><WordBuilderGame /></Layout>} />
        <Route path="/games/listen-match" element={<Layout><ListenAndMatchGame /></Layout>} />
        <Route path="/games/position-game" element={<Layout><PositionGameGame /></Layout>} />
        <Route path="/games/balloon-pop" element={<Layout><BalloonPopGame /></Layout>} />
        <Route path="/games/letter-fishing" element={<Layout><LetterFishingGame /></Layout>} />
        <Route path="/games/treasure-chest" element={<Layout><TreasureChestGame /></Layout>} />
        <Route path="/games/rocket-race" element={<Layout><RocketRaceGame /></Layout>} />
        <Route path="/games/letter-catcher" element={<Layout><LetterCatcherGame /></Layout>} />
        <Route path="/games/daily-quest" element={<Layout><DailyQuestGame /></Layout>} />
        {/* 22 New Games */}
        <Route path="/games/desert-caravan" element={<Layout><DesertCaravanGame /></Layout>} />
        <Route path="/games/gem-miner" element={<Layout><GemMinerGame /></Layout>} />
        <Route path="/games/magic-carpet" element={<Layout><MagicCarpetGame /></Layout>} />
        <Route path="/games/fruit-blender" element={<Layout><FruitBlenderGame /></Layout>} />
        <Route path="/games/star-constellation" element={<Layout><StarConstellationGame /></Layout>} />
        <Route path="/games/frog-leap" element={<Layout><FrogLeapGame /></Layout>} />
        <Route path="/games/pirate-island" element={<Layout><PirateIslandGame /></Layout>} />
        <Route path="/games/submarine-sonar" element={<Layout><SubmarineSonarGame /></Layout>} />
        <Route path="/games/train-coupler" element={<Layout><TrainCouplerGame /></Layout>} />
        <Route path="/games/kite-flying" element={<Layout><KiteFlyingGame /></Layout>} />
        <Route path="/games/castle-keymaker" element={<Layout><CastleKeymakerGame /></Layout>} />
        <Route path="/games/cookie-oven" element={<Layout><CookieOvenGame /></Layout>} />
        <Route path="/games/raindrop-rhythm" element={<Layout><RaindropRhythmGame /></Layout>} />
        <Route path="/games/dolphin-hoop" element={<Layout><DolphinHoopGame /></Layout>} />
        <Route path="/games/market-bazaar" element={<Layout><MarketBazaarGame /></Layout>} />
        <Route path="/games/solar-orbit" element={<Layout><SolarOrbitGame /></Layout>} />
        <Route path="/games/jungle-vine" element={<Layout><JungleVineGame /></Layout>} />
        <Route path="/games/mosaic-tile" element={<Layout><MosaicTileGame /></Layout>} />
        <Route path="/games/critter-whack" element={<Layout><CritterWhackGame /></Layout>} />
        <Route path="/games/rainbow-bridge" element={<Layout><RainbowBridgeGame /></Layout>} />
        <Route path="/games/lantern-glow" element={<Layout><LanternGlowGame /></Layout>} />
        <Route path="/games/gear-factory" element={<Layout><GearFactoryGame /></Layout>} />

        {/* 404 */}
        <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
