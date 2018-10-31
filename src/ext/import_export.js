import { generateStractorSelectorRule } from './stractor'

export function generateExportData (mainData) {
  const result = {
    main_data: Array.from(mainData),
    stractor_selector: generateStractorSelectorRule(mainData[0].children, mainData[0].fieldname)
  }
  return result
}
