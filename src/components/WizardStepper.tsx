import { ReactNode } from 'react'

interface WizardStepperProps {
  currentStep: number
  totalSteps: number
  stepTitles: string[]
}

export function WizardStepper({ currentStep, totalSteps, stepTitles }: WizardStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index + 1 <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <span className="mt-2 text-xs text-gray-600 text-center max-w-24">
                {stepTitles[index]}
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div className="flex-1 h-1 mx-4 bg-gray-200 rounded">
                <div
                  className={`h-full rounded transition-all duration-300 ${
                    index + 1 < currentStep ? 'bg-blue-600 w-full' : 'w-0'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}