import { explainProjectHealth } from '@/lib/ai/insights'
import { isAIConfigured } from '@/lib/ai/provider'
import { Sparkles, AlertTriangle } from 'lucide-react'

export async function ProjectHealthAIExplanation({ projectId, deterministicStatus }: { projectId: string, deterministicStatus: string }) {
  if (!isAIConfigured()) return null

  try {
    const aiInsight = await explainProjectHealth(projectId, deterministicStatus)
    
    return (
      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-6 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Health Explanation</h3>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          {aiInsight.explanation}
        </p>
        
        {aiInsight.riskFactors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-300 mb-2">Identified Risk Factors:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {aiInsight.riskFactors.map((factor: string, i: number) => (
                <li key={i} className="text-xs text-gray-600 dark:text-gray-400">{factor}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("AI Health Explanation Failed:", error)
    return null
  }
}
