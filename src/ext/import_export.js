import { generateStractorSelectorRule } from './stractor'

export function generateExportData (mainData) {
  const result = {
    main_data: Array.from(mainData),
    stractor_selector: generateStractorSelectorRule(mainData, 'root')
  }
  return result
}
