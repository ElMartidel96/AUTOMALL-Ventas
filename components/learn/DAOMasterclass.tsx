'use client';

/**
 * DAO MASTERCLASS INTERACTIVE MODULE
 * Educational module for CryptoGift DAO Special Invites
 *
 * Based on SalesMasterclass from cryptogift-wallets project
 * Adapted for DAO context with simplified flow
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Sparkles,
  Flame,
  BarChart3,
  Lock,
  Rocket,
  Banknote,
  Globe,
  Trophy,
  Clock,
  Heart,
  Gift,
  Shield,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Target,
  DollarSign,
  Award,
  Star,
  Play,
  ChevronRight,
  X,
  Check
} from 'lucide-react';

// Confetti effect
function triggerConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    for (let i = 0; i < particleCount; i++) {
      const confettiEl = document.createElement('div');
      confettiEl.style.position = 'fixed';
      confettiEl.style.width = '10px';
      confettiEl.style.height = '10px';
      confettiEl.style.backgroundColor = ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#00CED1', '#32CD32'][Math.floor(Math.random() * 6)];
      confettiEl.style.left = Math.random() * 100 + '%';
      confettiEl.style.top = '-10px';
      confettiEl.style.opacity = '1';
      confettiEl.style.transform = `rotate(${Math.random() * 360}deg)`;
      confettiEl.style.zIndex = '10000';
      confettiEl.className = 'confetti-particle';

      document.body.appendChild(confettiEl);

      confettiEl.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ], {
        duration: randomInRange(2000, 4000),
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).onfinish = () => confettiEl.remove();
    }
  }, 100);
}

// Types
interface EducationBlock {
  id: string;
  title: string;
  duration: number;
  type: 'intro' | 'concept' | 'features' | 'benefits' | 'community' | 'complete';
  content: {
    headline?: string;
    description?: string;
    points?: { icon: React.ComponentType<{className?: string}>; text: string }[];
    stat?: string;
    emphasis?: string;
    final?: string;
  };
  question?: {
    text: string;
    options: { text: string; isCorrect: boolean }[];
  };
  nextBlock?: string;
}

interface QuestionAnswer {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

// Education blocks - adapted for DAO context
const EDUCATION_BLOCKS: EducationBlock[] = [
  {
    id: 'intro',
    title: 'Bienvenido a CryptoGift DAO',
    duration: 30,
    type: 'intro',
    content: {
      headline: 'Has sido invitado a algo especial...',
      description: `Esta invitacion especial te da acceso a una comunidad exclusiva
                   de pioneros en tecnologia blockchain. Alguien que confía en ti
                   te ha seleccionado para ser parte de esto.`,
      emphasis: 'Una comunidad • Una mision • Un futuro descentralizado',
      stat: 'Solo usuarios seleccionados reciben esta invitacion'
    },
    question: {
      text: '¿Por que recibiste esta invitacion?',
      options: [
        { text: 'Alguien confío en mi y me selecciono', isCorrect: true },
        { text: 'Es spam aleatorio', isCorrect: false },
        { text: 'Me la compre', isCorrect: false }
      ]
    },
    nextBlock: 'concept'
  },
  {
    id: 'concept',
    title: '¿Que es un DAO?',
    duration: 45,
    type: 'concept',
    content: {
      headline: 'Organizacion Autonoma Descentralizada',
      description: `Un DAO es una organizacion gobernada por sus miembros,
                   no por ejecutivos. Cada decision se vota de forma transparente
                   en la blockchain.`,
      points: [
        { icon: Users, text: 'Gobernanza democratica' },
        { icon: Shield, text: 'Transparencia total on-chain' },
        { icon: Banknote, text: 'Tesoreria comunitaria' },
        { icon: Trophy, text: 'Recompensas por participar' }
      ],
      stat: '$25+ mil millones gestionados por DAOs globalmente'
    },
    question: {
      text: '¿Quien toma las decisiones en un DAO?',
      options: [
        { text: 'Los miembros mediante votacion', isCorrect: true },
        { text: 'Un CEO o presidente', isCorrect: false },
        { text: 'Los inversores mayoritarios solamente', isCorrect: false }
      ]
    },
    nextBlock: 'features'
  },
  {
    id: 'features',
    title: 'CryptoGift DAO: Caracteristicas',
    duration: 45,
    type: 'features',
    content: {
      headline: 'Tecnologia de Vanguardia',
      points: [
        { icon: Gift, text: 'NFT-Wallets con valor real' },
        { icon: Flame, text: 'Gas 100% patrocinado' },
        { icon: Shield, text: 'Seguridad blockchain' },
        { icon: Zap, text: 'Transacciones instantaneas' },
        { icon: Globe, text: 'Acceso global sin fronteras' },
        { icon: Star, text: 'Token CGC para gobernanza' }
      ],
      emphasis: 'Sin complicaciones tecnicos • Sin costos ocultos'
    },
    question: {
      text: '¿Cuanto pagas de gas fees en CryptoGift DAO?',
      options: [
        { text: '$0 - Todo esta patrocinado', isCorrect: true },
        { text: '$5 USD por transaccion', isCorrect: false },
        { text: 'Variable segun el mercado', isCorrect: false }
      ]
    },
    nextBlock: 'benefits'
  },
  {
    id: 'benefits',
    title: 'Beneficios para Miembros',
    duration: 45,
    type: 'benefits',
    content: {
      headline: 'Lo que Ganas al Unirte',
      points: [
        { icon: DollarSign, text: 'Tokens CGC de gobernanza' },
        { icon: BarChart3, text: 'Participacion en ganancias' },
        { icon: Award, text: 'Acceso a eventos exclusivos' },
        { icon: Target, text: 'Tareas remuneradas' },
        { icon: Heart, text: 'Comunidad de apoyo 24/7' },
        { icon: Rocket, text: 'Oportunidades de crecimiento' }
      ],
      stat: 'Los primeros miembros reciben beneficios extra'
    },
    question: {
      text: '¿Que token usamos para gobernar el DAO?',
      options: [
        { text: 'CGC - CryptoGift Coin', isCorrect: true },
        { text: 'Bitcoin', isCorrect: false },
        { text: 'No usamos tokens', isCorrect: false }
      ]
    },
    nextBlock: 'community'
  },
  {
    id: 'community',
    title: 'Nuestra Comunidad',
    duration: 30,
    type: 'community',
    content: {
      headline: 'Unete a Miles de Pioneros',
      description: `CryptoGift DAO no es solo tecnologia - es una comunidad de personas
                   que creen en el futuro de las finanzas descentralizadas y quieren
                   ser parte del cambio.`,
      points: [
        { icon: Users, text: '+10,000 miembros activos' },
        { icon: Globe, text: 'Presencia en 50+ paises' },
        { icon: TrendingUp, text: '$500K+ en recompensas distribuidas' }
      ],
      emphasis: 'El mejor momento para unirse fue ayer. El segundo mejor es HOY.'
    },
    question: {
      text: '¿Que hace especial a nuestra comunidad?',
      options: [
        { text: 'Vision compartida de descentralizacion', isCorrect: true },
        { text: 'Solo es para hacer dinero rapido', isCorrect: false },
        { text: 'No hay comunidad, solo tecnologia', isCorrect: false }
      ]
    },
    nextBlock: 'complete'
  },
  {
    id: 'complete',
    title: '¡Felicidades!',
    duration: 60,
    type: 'complete',
    content: {
      headline: '¡Has Completado el Masterclass!',
      description: `Ahora entiendes lo que significa ser parte de CryptoGift DAO.
                   El siguiente paso es conectar tu wallet para finalizar tu entrada
                   a la comunidad.`,
      points: [
        { icon: CheckCircle, text: 'Educacion completada' },
        { icon: Trophy, text: 'Listo para unirte' },
        { icon: Gift, text: 'Recompensas esperandote' }
      ],
      final: 'Conecta tu wallet para completar tu registro en el DAO'
    }
  }
];

interface DAOMasterclassProps {
  onComplete: (data: {
    questionsScore: { correct: number; total: number };
    questionsAnswered: QuestionAnswer[];
  }) => void;
  inviteCode?: string;
}

export default function DAOMasterclass({
  onComplete,
  inviteCode
}: DAOMasterclassProps) {
  // State
  const [currentBlock, setCurrentBlock] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EDUCATION_BLOCKS[0].duration);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuestionFeedback, setShowQuestionFeedback] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState<QuestionAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const timerRef = useRef<NodeJS.Timeout>();

  // Timer Management
  useEffect(() => {
    if (!isPaused && timeLeft > 0 && !showQuestionFeedback) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isPaused, showQuestionFeedback]);

  // Answer Handler
  const handleAnswerSelect = useCallback((optionIndex: number) => {
    const block = EDUCATION_BLOCKS[currentBlock];
    if (!block.question) return;

    setSelectedAnswer(optionIndex);
    setShowQuestionFeedback(true);

    const isCorrect = block.question.options[optionIndex].isCorrect;

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
    setTotalQuestions(prev => prev + 1);

    // Save detailed answer tracking
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    const selectedOption = block.question.options[optionIndex];
    const correctOption = block.question.options.find(opt => opt.isCorrect);

    const answerDetail: QuestionAnswer = {
      questionId: `q_${block.id}`,
      questionText: block.question.text,
      selectedAnswer: selectedOption.text,
      correctAnswer: correctOption?.text || '',
      isCorrect,
      timeSpent
    };

    setQuestionsAnswered(prev => [...prev, answerDetail]);
    setQuestionStartTime(Date.now());

    // Allow proceeding after answering
    setTimeout(() => {
      setCanProceed(true);
    }, 1500);
  }, [currentBlock, questionStartTime]);

  // Block Navigation
  const handleNextBlock = useCallback(() => {
    const currentBlockData = EDUCATION_BLOCKS[currentBlock];

    // If this is the last block (complete), trigger completion
    if (currentBlockData.type === 'complete' || !currentBlockData.nextBlock) {
      triggerConfetti();
      onComplete({
        questionsScore: { correct: correctAnswers, total: totalQuestions },
        questionsAnswered
      });
      return;
    }

    // Find next block
    const nextBlockIndex = EDUCATION_BLOCKS.findIndex(block => block.id === currentBlockData.nextBlock);

    if (nextBlockIndex !== -1) {
      setCurrentBlock(nextBlockIndex);
      setTimeLeft(EDUCATION_BLOCKS[nextBlockIndex].duration);
      setSelectedAnswer(null);
      setShowQuestionFeedback(false);
      setCanProceed(false);

      // Scroll to top
      window.scrollTo(0, 0);
    }
  }, [currentBlock, correctAnswers, totalQuestions, questionsAnswered, onComplete]);

  const block = EDUCATION_BLOCKS[currentBlock];
  const progress = ((currentBlock + 1) / EDUCATION_BLOCKS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm">
        <div className="h-1 bg-gray-700">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between items-center px-4 py-2 text-sm">
          <span className="text-white/80">
            {currentBlock + 1} / {EDUCATION_BLOCKS.length}
          </span>
          <span className="text-white/80 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-32 px-4 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Block Title */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full mb-4"
              >
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300 font-medium">{block.title}</span>
              </motion.div>

              {block.content.headline && (
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {block.content.headline}
                </h1>
              )}

              {block.content.description && (
                <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                  {block.content.description}
                </p>
              )}
            </div>

            {/* Points/Features */}
            {block.content.points && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {block.content.points.map((point, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <point.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-medium">{point.text}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Stat */}
            {block.content.stat && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl border border-purple-500/30"
              >
                <p className="text-xl md:text-2xl font-bold text-white">
                  {block.content.stat}
                </p>
              </motion.div>
            )}

            {/* Emphasis */}
            {block.content.emphasis && (
              <div className="text-center">
                <p className="text-lg text-cyan-400 font-medium">
                  {block.content.emphasis}
                </p>
              </div>
            )}

            {/* Final Message */}
            {block.content.final && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30"
              >
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-xl text-white font-medium">
                  {block.content.final}
                </p>
              </motion.div>
            )}

            {/* Question */}
            {block.question && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-purple-400" />
                  {block.question.text}
                </h3>

                <div className="space-y-3">
                  {block.question.options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = option.isCorrect;
                    const showResult = showQuestionFeedback;

                    let bgColor = 'bg-white/5 hover:bg-white/10';
                    let borderColor = 'border-white/10';
                    let icon = null;

                    if (showResult && isSelected) {
                      if (isCorrect) {
                        bgColor = 'bg-green-500/20';
                        borderColor = 'border-green-500';
                        icon = <Check className="w-5 h-5 text-green-400" />;
                      } else {
                        bgColor = 'bg-red-500/20';
                        borderColor = 'border-red-500';
                        icon = <X className="w-5 h-5 text-red-400" />;
                      }
                    } else if (showResult && isCorrect) {
                      bgColor = 'bg-green-500/10';
                      borderColor = 'border-green-500/50';
                    }

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => !showQuestionFeedback && handleAnswerSelect(idx)}
                        disabled={showQuestionFeedback}
                        className={`w-full p-4 rounded-xl border ${borderColor} ${bgColor} text-left transition-all ${!showQuestionFeedback ? 'cursor-pointer' : 'cursor-default'}`}
                        whileHover={!showQuestionFeedback ? { scale: 1.02 } : {}}
                        whileTap={!showQuestionFeedback ? { scale: 0.98 } : {}}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{option.text}</span>
                          {icon}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {showQuestionFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-xl ${
                      block.question.options[selectedAnswer!]?.isCorrect
                        ? 'bg-green-500/20 border border-green-500/50'
                        : 'bg-orange-500/20 border border-orange-500/50'
                    }`}
                  >
                    <p className={`font-medium ${
                      block.question.options[selectedAnswer!]?.isCorrect
                        ? 'text-green-400'
                        : 'text-orange-400'
                    }`}>
                      {block.question.options[selectedAnswer!]?.isCorrect
                        ? '¡Correcto! Excelente comprension.'
                        : 'No exactamente, pero sigue adelante.'}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-md border-t border-white/10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-white/60 text-sm">
            {inviteCode && (
              <span>Codigo: {inviteCode}</span>
            )}
          </div>

          <motion.button
            onClick={handleNextBlock}
            disabled={block.question && !canProceed && !showQuestionFeedback}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              (canProceed || !block.question || block.type === 'complete')
                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            whileHover={(canProceed || !block.question || block.type === 'complete') ? { scale: 1.05 } : {}}
            whileTap={(canProceed || !block.question || block.type === 'complete') ? { scale: 0.95 } : {}}
          >
            {block.type === 'complete' ? (
              <>
                <span>Completar</span>
                <CheckCircle className="w-5 h-5" />
              </>
            ) : (
              <>
                <span>Continuar</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Score Display */}
      {totalQuestions > 0 && (
        <div className="fixed top-16 right-4 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
          <div className="flex items-center gap-2 text-white text-sm">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>{correctAnswers}/{totalQuestions}</span>
          </div>
        </div>
      )}
    </div>
  );
}
