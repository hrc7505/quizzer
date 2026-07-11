"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, Text, Button, ProgressBar, Badge, MessageBar, MessageBarBody, Spinner, TeachingPopover, TeachingPopoverTrigger, TeachingPopoverSurface, TeachingPopoverHeader, TeachingPopoverTitle, TeachingPopoverBody } from "@fluentui/react-components";
import { useRouter } from "next/navigation";

export function QuizWizard({ quiz }: { quiz: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeTaken, setTimeTaken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const timer = setInterval(() => setTimeTaken(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOptionClick = (option: string) => {
    if (selectedOption) return; // Prevent changing answer
    setSelectedOption(option);
  };

  const handleNext = async () => {
    if (!selectedOption) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        selectedAnswer: selectedOption,
        isCorrect
      }
    ];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowHint(false);
    } else {
      // Submit Attempt
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId: quiz.id,
            timeTakenSec: timeTaken,
            answers: newAnswers,
          })
        });
        const data = await res.json();
        if (data.success) {
          router.push(`/quiz/results/${data.attemptId}`);
        } else {
          alert("Failed to submit attempt");
        }
      } catch (err) {
        alert("An error occurred");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (questions.length === 0) return <Text>No questions found in this quiz.</Text>;

  const progress = (currentIndex / questions.length);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size={600} weight="bold">{quiz.title}</Text>
        <Badge appearance="filled" color="brand">{formatTime(timeTaken)}</Badge>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text size={200}>Question {currentIndex + 1} of {questions.length}</Text>
          <Text size={200}>{Math.round(progress * 100)}%</Text>
        </div>
        <ProgressBar value={progress} max={1} />
      </div>

      {/* Question Card */}
      <Card style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text size={500} weight="semibold" style={{ flex: 1 }}>{currentQuestion.text}</Text>
          <TeachingPopover open={showHint} onOpenChange={(e, data) => setShowHint(data.open)}>
            <TeachingPopoverTrigger>
              <Button appearance="subtle">💡 Hint</Button>
            </TeachingPopoverTrigger>
            <TeachingPopoverSurface>
              <TeachingPopoverHeader>
                <TeachingPopoverTitle>Hint</TeachingPopoverTitle>
              </TeachingPopoverHeader>
              <TeachingPopoverBody>
                {currentQuestion.hint}
              </TeachingPopoverBody>
            </TeachingPopoverSurface>
          </TeachingPopover>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
          {currentQuestion.options.map((opt: string, i: number) => {
            const isSelected = selectedOption === opt;
            const isCorrectAnswer = currentQuestion.correctAnswer === opt;
            
            let backgroundColor = '#fff';
            let borderColor = '#d1d1d1';
            let color = '#333';

            if (selectedOption) {
              if (isCorrectAnswer) {
                backgroundColor = '#e6ffed'; // Green
                borderColor = '#2da44e';
                color = '#1f883d';
              } else if (isSelected && !isCorrectAnswer) {
                backgroundColor = '#ffebe9'; // Red
                borderColor = '#cf222e';
                color = '#a40e26';
              }
            } else {
              backgroundColor = '#f3f2f1';
            }

            return (
              <div 
                key={i} 
                onClick={() => handleOptionClick(opt)}
                style={{
                  padding: '16px',
                  border: `2px solid ${borderColor}`,
                  borderRadius: '8px',
                  backgroundColor,
                  color,
                  cursor: selectedOption ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: selectedOption && isCorrectAnswer ? 'bold' : 'normal'
                }}
              >
                {opt}
              </div>
            );
          })}
        </div>

        {selectedOption && (
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0f6ff', borderRadius: '8px' }}>
            <Text weight="bold">Explanation:</Text>
            <p style={{ marginTop: '8px' }}>{currentQuestion.description}</p>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            appearance="primary" 
            size="large" 
            disabled={!selectedOption || isSubmitting} 
            onClick={handleNext}
          >
            {isSubmitting ? <Spinner size="tiny" /> : (currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question")}
          </Button>
        </div>

      </Card>
    </div>
  );
}
