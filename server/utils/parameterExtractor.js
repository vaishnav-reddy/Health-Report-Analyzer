const levenshtein = require('levenshtein-distance');

// Common health parameter patterns and their variations
const HEALTH_PARAMETERS = {
  // Blood sugar/glucose
  'glucose': {
    patterns: ['glucose', 'blood glucose', 'blood sugar', 'fasting glucose', 'random glucose', 'glucosa'],
    units: ['mg/dl', 'mg/dL', 'mmol/l', 'mmol/L'],
    category: 'Blood Sugar',
    normalRanges: {
      'mg/dl': '70-100',
      'mg/dL': '70-100',
      'mmol/l': '3.9-5.6',
      'mmol/L': '3.9-5.6'
    }
  },
  // Cholesterol
  'total cholesterol': {
    patterns: ['total cholesterol', 'cholesterol total', 'cholesterol, total', 'cholesterol', 'serum cholesterol', 'cho-pod'],
    units: ['mg/dl', 'mg/dL', 'mmol/l', 'mmol/L'],
    category: 'Lipid Profile',
    normalRanges: {
      'mg/dl': '<200',
      'mg/dL': '<200',
      'mmol/l': '<5.2',
      'mmol/L': '<5.2'
    }
  },
  'hdl cholesterol': {
    patterns: ['hdl cholesterol', 'hdl-c', 'hdl', 'high density lipoprotein', 'hdl, cholesterol'],
    units: ['mg/dl', 'mg/dL', 'mmol/l', 'mmol/L'],
    category: 'Lipid Profile',
    normalRanges: {
      'mg/dl': '>40',
      'mg/dL': '>40',
      'mmol/l': '>1.0',
      'mmol/L': '>1.0'
    }
  },
  'ldl cholesterol': {
    patterns: ['ldl cholesterol', 'ldl-c', 'ldl', 'low density lipoprotein', 'ldl, cholesterol', 'ldl cholesterol, calculated'],
    units: ['mg/dl', 'mg/dL', 'mmol/l', 'mmol/L'],
    category: 'Lipid Profile',
    normalRanges: {
      'mg/dl': '<100',
      'mg/dL': '<100',
      'mmol/l': '<2.6',
      'mmol/L': '<2.6'
    }
  },
  'vldl cholesterol': {
    patterns: ['vldl cholesterol', 'vldl', 'very low density lipoprotein', 'vldl, cholesterol', 'vldl cholesterol,calculated'],
    units: ['mg/dl', 'mg/dL', 'mmol/l', 'mmol/L'],
    category: 'Lipid Profile',
    normalRanges: {
      'mg/dl': '<30',
      'mg/dL': '<30',
      'mmol/l': '<0.8',
      'mmol/L': '<0.8'
    }
  },
  'non-hdl cholesterol': {
    patterns: ['non-hdl cholesterol', 'non hdl cholesterol', 'nonhdl cholesterol'],
    units: ['mg/dl', 'mg/dL', 'mmol/l', 'mmol/L'],
    category: 'Lipid Profile',
    normalRanges: {
      'mg/dl': '<130',
      'mg/dL': '<130',
      'mmol/l': '<3.4',
      'mmol/L': '<3.4'
    }
  },
  // Triglycerides
  'triglycerides': {
    patterns: ['triglycerides', 'triglyceride', 'tg', 'trigs'],
    units: ['mg/dl', 'mg/dL', 'mmol/l', 'mmol/L'],
    category: 'Lipid Profile',
    normalRanges: {
      'mg/dl': '<150',
      'mg/dL': '<150',
      'mmol/l': '<1.7',
      'mmol/L': '<1.7'
    }
  },
  // Blood pressure (though typically not in lab reports)
  'systolic bp': {
    patterns: ['systolic', 'systolic bp', 'systolic blood pressure', 'sbp'],
    units: ['mmhg', 'mmHg'],
    category: 'Vital Signs',
    normalRanges: {
      'mmhg': '90-120',
      'mmHg': '90-120'
    }
  },
  'diastolic bp': {
    patterns: ['diastolic', 'diastolic bp', 'diastolic blood pressure', 'dbp'],
    units: ['mmhg', 'mmHg'],
    category: 'Vital Signs',
    normalRanges: {
      'mmhg': '60-80',
      'mmHg': '60-80'
    }
  },
  // Hemoglobin A1C
  'hemoglobin a1c': {
    patterns: ['hemoglobin a1c', 'hba1c', 'a1c', 'glycated hemoglobin', 'hgba1c'],
    units: ['%', 'percent'],
    category: 'Blood Sugar',
    normalRanges: {
      '%': '<5.7',
      'percent': '<5.7'
    }
  },
  // Vitamins
  'vitamin d': {
    patterns: ['vitamin d', 'vitamin d3', 'vitamin d2', '25-oh vitamin d', '25(oh)d'],
    units: ['ng/ml', 'ng/mL', 'nmol/l', 'nmol/L'],
    category: 'Vitamins',
    normalRanges: {
      'ng/ml': '30-100',
      'ng/mL': '30-100',
      'nmol/l': '75-250',
      'nmol/L': '75-250'
    }
  },
  'vitamin b12': {
    patterns: ['vitamin b12', 'vitamin b-12', 'b12', 'cobalamin'],
    units: ['pg/ml', 'pg/mL', 'pmol/l', 'pmol/L'],
    category: 'Vitamins',
    normalRanges: {
      'pg/ml': '200-900',
      'pg/mL': '200-900',
      'pmol/l': '148-664',
      'pmol/L': '148-664'
    }
  },
  // Thyroid
  'tsh': {
    patterns: ['tsh', 'thyroid stimulating hormone', 'thyrotropin'],
    units: ['miu/l', 'mIU/L', 'mu/l', 'mU/L'],
    category: 'Thyroid Function',
    normalRanges: {
      'miu/l': '0.4-4.0',
      'mIU/L': '0.4-4.0',
      'mu/l': '0.4-4.0',
      'mU/L': '0.4-4.0'
    }
  },
  // Complete Blood Count
  'hemoglobin': {
    patterns: ['hemoglobin', 'hgb', 'hb'],
    units: ['g/dl', 'g/dL', 'g/l', 'g/L'],
    category: 'Complete Blood Count',
    normalRanges: {
      'g/dl': '12.0-16.0',
      'g/dL': '12.0-16.0',
      'g/l': '120-160',
      'g/L': '120-160'
    }
  },
  'packed cell volume': {
    patterns: ['packed cell volume', 'pcv', 'hematocrit', 'hct'],
    units: ['%', 'percent'],
    category: 'Complete Blood Count',
    normalRanges: {
      '%': '40-50',
      'percent': '40-50'
    }
  },
  'rbc count': {
    patterns: ['rbc count', 'red blood cell count', 'red blood cells', 'rbc', 'erythrocytes'],
    units: ['mill/mm3', 'million/mm3', '10^6/ul', '10^6/μL', 'm/ul', 'M/μL'],
    category: 'Complete Blood Count',
    normalRanges: {
      'mill/mm3': '4.5-5.5',
      'million/mm3': '4.5-5.5',
      '10^6/ul': '4.2-5.4',
      '10^6/μL': '4.2-5.4',
      'm/ul': '4.2-5.4',
      'M/μL': '4.2-5.4'
    }
  },
  'mcv': {
    patterns: ['mcv', 'mean corpuscular volume'],
    units: ['fl', 'fL'],
    category: 'Complete Blood Count',
    normalRanges: {
      'fl': '83-101',
      'fL': '83-101'
    }
  },
  'mch': {
    patterns: ['mch', 'mean corpuscular hemoglobin'],
    units: ['pg', 'pG'],
    category: 'Complete Blood Count',
    normalRanges: {
      'pg': '27-32',
      'pG': '27-32'
    }
  },
  'mchc': {
    patterns: ['mchc', 'mean corpuscular hemoglobin concentration'],
    units: ['g/dl', 'g/dL'],
    category: 'Complete Blood Count',
    normalRanges: {
      'g/dl': '31.5-34.5',
      'g/dL': '31.5-34.5'
    }
  },
  'rdw': {
    patterns: ['rdw', 'red cell distribution width', 'red cell distribution width (rdw)'],
    units: ['%', 'percent'],
    category: 'Complete Blood Count',
    normalRanges: {
      '%': '11.6-14.0',
      'percent': '11.6-14.0'
    }
  },
  'total leucocyte count': {
    patterns: ['total leucocyte count', 'tlc', 'white blood cell count', 'white blood cells', 'wbc', 'leucocytes', 'leukocytes'],
    units: ['thou/mm3', 'thousand/mm3', '10^3/ul', '10^3/μL', 'k/ul', 'K/μL', '/ul', '/μL'],
    category: 'Complete Blood Count',
    normalRanges: {
      'thou/mm3': '4.0-10.0',
      'thousand/mm3': '4.0-10.0',
      '10^3/ul': '4.5-11.0',
      '10^3/μL': '4.5-11.0',
      'k/ul': '4.5-11.0',
      'K/μL': '4.5-11.0',
      '/ul': '4500-11000',
      '/μL': '4500-11000'
    }
  },
  'neutrophils': {
    patterns: ['neutrophils', 'segmented neutrophils', 'neutrophil'],
    units: ['%', 'percent', 'thou/mm3', 'thousand/mm3'],
    category: 'Complete Blood Count',
    normalRanges: {
      '%': '40-80',
      'percent': '40-80',
      'thou/mm3': '2.0-7.0',
      'thousand/mm3': '2.0-7.0'
    }
  },
  'lymphocytes': {
    patterns: ['lymphocytes', 'lymphocyte'],
    units: ['%', 'percent', 'thou/mm3', 'thousand/mm3'],
    category: 'Complete Blood Count',
    normalRanges: {
      '%': '20-40',
      'percent': '20-40',
      'thou/mm3': '1.0-3.0',
      'thousand/mm3': '1.0-3.0'
    }
  },
  'monocytes': {
    patterns: ['monocytes', 'monocyte'],
    units: ['%', 'percent', 'thou/mm3', 'thousand/mm3'],
    category: 'Complete Blood Count',
    normalRanges: {
      '%': '2-10',
      'percent': '2-10',
      'thou/mm3': '0.20-1.00',
      'thousand/mm3': '0.20-1.00'
    }
  },
  'eosinophils': {
    patterns: ['eosinophils', 'eosinophil'],
    units: ['%', 'percent', 'thou/mm3', 'thousand/mm3'],
    category: 'Complete Blood Count',
    normalRanges: {
      '%': '1-6',
      'percent': '1-6',
      'thou/mm3': '0.02-0.50',
      'thousand/mm3': '0.02-0.50'
    }
  },
  'basophils': {
    patterns: ['basophils', 'basophil'],
    units: ['%', 'percent', 'thou/mm3', 'thousand/mm3'],
    category: 'Complete Blood Count',
    normalRanges: {
      '%': '<2',
      'percent': '<2',
      'thou/mm3': '<0.20',
      'thousand/mm3': '<0.20'
    }
  },
  'platelets': {
    patterns: ['platelets', 'plt', 'thrombocytes'],
    units: ['10^3/ul', '10^3/μL', 'k/ul', 'K/μL'],
    category: 'Complete Blood Count',
    normalRanges: {
      '10^3/ul': '150-450',
      '10^3/μL': '150-450',
      'k/ul': '150-450',
      'K/μL': '150-450'
    }
  }
};

// Extract health parameters from text
function extractHealthParameters(text) {
  const parameters = [];
  
  console.log('=== PARAMETER EXTRACTION START ===');
  console.log('Raw text sample:', text.substring(0, 300) + '...');
  console.log('Total text length:', text.length);
  
  // If text is too short or garbled, return empty
  if (!text || text.length < 20) {
    console.log('Text too short for parameter extraction');
    return parameters;
  }
  
  // Advanced text preprocessing to handle OCR errors
  const preprocessedText = preprocessOCRText(text);
  console.log('Preprocessed text sample:', preprocessedText.substring(0, 300) + '...');
  
  // Split into lines and clean
  const lines = preprocessedText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 3);
  
  console.log('Total lines after preprocessing:', lines.length);
  console.log('Sample lines:', lines.slice(0, 8));
  
  // Try multiple extraction methods with enhanced pattern matching
  
  // Method 1: Direct pattern matching with fuzzy matching for known parameters
  console.log('\n--- Method 1: Direct Pattern Matching ---');
  for (const [paramName, paramInfo] of Object.entries(HEALTH_PARAMETERS)) {
    const matches = findParameterInTextFuzzy(preprocessedText, lines, paramName, paramInfo);
    if (matches.length > 0) {
      console.log(`✓ Found ${paramName}:`, matches[0]);
      parameters.push(matches[0]);
    }
  }
  
  // Method 2: Enhanced table format extraction with OCR error correction
  console.log('\n--- Method 2: Table Format Extraction ---');
  const tableParams = extractFromTableFormatAdvanced(lines);
  parameters.push(...tableParams);
  
  // Method 3: Contextual extraction using medical term recognition
  console.log('\n--- Method 3: Contextual Medical Term Extraction ---');
  const contextParams = extractWithMedicalContext(lines);
  parameters.push(...contextParams);
  
  // Method 4: Pattern-based extraction for common lab report layouts
  console.log('\n--- Method 4: Layout Pattern Recognition ---');
  const layoutParams = extractFromLayoutPatterns(lines);
  parameters.push(...layoutParams);
  
  // Method 5: Last resort - any numeric values with potential health significance
  if (parameters.length === 0) {
    console.log('\n--- Method 5: Fallback Numeric Extraction ---');
    const numericParams = extractNumericValuesAdvanced(lines);
    parameters.push(...numericParams);
  }
  
  console.log('\n=== EXTRACTION RESULTS ===');
  console.log('Total parameters found:', parameters.length);
  parameters.forEach((param, index) => {
    console.log(`${index + 1}. ${param.name} = ${param.value} ${param.unit} (${param.status}) [confidence: ${param.confidence}]`);
  });
  console.log('=== PARAMETER EXTRACTION END ===\n');
  
  // Remove duplicates and return best results
  return removeDuplicatesAdvanced(parameters);
}

// Advanced OCR text preprocessing to handle common OCR errors
function preprocessOCRText(text) {
  let processed = text;
  
  // Common OCR error corrections for medical terms
  const ocrCorrections = {
    // Common OCR misreads for medical terms
    'chclesterol': 'cholesterol',
    'chdlesterol': 'cholesterol',
    'choiesterol': 'cholesterol',
    'cholestercl': 'cholesterol',
    'giucose': 'glucose',
    'gIucose': 'glucose',
    'giucsse': 'glucose',
    'hemogiobln': 'hemoglobin',
    'hemogiobm': 'hemoglobin',
    'hemogiobin': 'hemoglobin',
    'trigiycerides': 'triglycerides',
    'trigiycendes': 'triglycerides',
    'vitarnin': 'vitamin',
    'vitamn': 'vitamin',
    'proteln': 'protein',
    'creatinlne': 'creatinine',
    'bilirubin': 'bilirubin',
    'haemoglobin': 'hemoglobin',
    
    // Common unit corrections
    'mg/dl': 'mg/dL',
    'mgldl': 'mg/dL',
    'mg dl': 'mg/dL',
    'mg/ dl': 'mg/dL',
    'mmol/l': 'mmol/L',
    'mmolll': 'mmol/L',
    'mmol l': 'mmol/L',
    'mmol/ l': 'mmol/L',
    'gldl': 'g/dL',
    'g dl': 'g/dL',
    'g/ dl': 'g/dL',
    
    // Common numeric/formatting corrections
    'O': '0', // Capital O confused with zero
    'l': '1', // lowercase l confused with one (in numbers)
    '§': '5', // Section symbol confused with 5
    'S': '5', // Capital S confused with 5 (in numbers)
    'B': '8', // Capital B confused with 8 (in numbers)
    
    // Common separator corrections
    ' - ': ' : ',
    ' — ': ' : ',
    ' – ': ' : '
  };
  
  // Apply corrections
  for (const [error, correction] of Object.entries(ocrCorrections)) {
    processed = processed.replace(new RegExp(error, 'gi'), correction);
  }
  
  // Clean up extra spaces and normalize formatting
  processed = processed
    .replace(/\s+/g, ' ')  // Multiple spaces to single space
    .replace(/\s+:/g, ':') // Remove space before colon
    .replace(/:\s+/g, ': ') // Normalize space after colon
    .replace(/\s+,/g, ',') // Remove space before comma
    .replace(/,\s+/g, ', ') // Normalize space after comma
    .replace(/\s*\n\s*/g, '\n') // Clean line breaks
    .trim();
  
  return processed;
}

// Enhanced fuzzy matching for parameter names
function findParameterInTextFuzzy(text, lines, paramName, paramInfo) {
  const matches = [];
  
  for (const pattern of paramInfo.patterns) {
    // Try exact matching first
    const exactMatches = findExactParameterMatches(text, lines, pattern, paramInfo);
    matches.push(...exactMatches);
    
    // Try fuzzy matching for OCR errors
    const fuzzyMatches = findFuzzyParameterMatches(text, lines, pattern, paramInfo);
    matches.push(...fuzzyMatches);
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 1); // Return best match only
}

function findExactParameterMatches(text, lines, pattern, paramInfo) {
  const matches = [];
  const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
  
  for (const line of lines) {
    if (regex.test(line.toLowerCase())) {
      const extracted = extractValueFromLineAdvanced(line, paramInfo.units, pattern);
      if (extracted && extracted.confidence > 0.6) {
        matches.push({
          name: formatParameterName(pattern),
          value: extracted.value,
          unit: extracted.unit,
          category: paramInfo.category || 'General',
          normalRange: paramInfo.normalRanges[extracted.unit] || 'Not available',
          status: determineStatus(extracted.value, paramInfo.normalRanges[extracted.unit]),
          confidence: extracted.confidence
        });
      }
    }
  }
  
  return matches;
}

function findFuzzyParameterMatches(text, lines, pattern, paramInfo) {
  const matches = [];
  const patternWords = pattern.toLowerCase().split(/\s+/);
  
  for (const line of lines) {
    const lineWords = line.toLowerCase().split(/\s+/);
    
    // Check if most words from pattern are present with fuzzy matching
    let matchedWords = 0;
    for (const patternWord of patternWords) {
      for (const lineWord of lineWords) {
        if (fuzzyMatch(patternWord, lineWord, 0.8)) {
          matchedWords++;
          break;
        }
      }
    }
    
    // If most pattern words matched, try to extract value
    if (matchedWords >= Math.ceil(patternWords.length * 0.7)) {
      const extracted = extractValueFromLineAdvanced(line, paramInfo.units, pattern);
      if (extracted && extracted.confidence > 0.5) {
        matches.push({
          name: formatParameterName(pattern),
          value: extracted.value,
          unit: extracted.unit,
          category: paramInfo.category || 'General',
          normalRange: paramInfo.normalRanges[extracted.unit] || 'Not available',
          status: determineStatus(extracted.value, paramInfo.normalRanges[extracted.unit]),
          confidence: extracted.confidence * 0.8 // Lower confidence for fuzzy matches
        });
      }
    }
  }
  
  return matches;
}

// Advanced value extraction with better OCR error handling
function extractValueFromLineAdvanced(line, possibleUnits, parameterName = '') {
  console.log(`Extracting from line: "${line}"`);
  
  // Enhanced patterns for various lab report formats with OCR tolerance
  const patterns = [
    // Standard table format: "Parameter  Value  Unit  Range"
    /([a-zA-Z\s,\.\-()]{3,}?)\s{2,}([\d\.]+)\s{1,}([a-zA-Z\/\%μ\^0-9<>]+)(?:\s+([<>\d\.\-\s]+))?/,
    // Colon separated: "Parameter: Value Unit"
    /([a-zA-Z\s,\.\-()]{3,}?):\s*([\d\.]+)\s*([a-zA-Z\/\%μ\^0-9<>]+)/,
    // Dash separated: "Parameter - Value Unit"
    /([a-zA-Z\s,\.\-()]{3,}?)\s*[-–—]\s*([\d\.]+)\s*([a-zA-Z\/\%μ\^0-9<>]+)/,
    // Tab or multiple space separated
    /([a-zA-Z\s,\.\-()]{3,}?)\s*\t+\s*([\d\.]+)\s*([a-zA-Z\/\%μ\^0-9<>]+)/,
    // Value first format: "Value Unit Parameter"
    /([\d\.]+)\s*([a-zA-Z\/\%μ\^0-9<>]+)\s+([a-zA-Z\s,\.\-()]{3,})/,
    // Flexible format with any separator
    /([\d\.]+)\s*([a-zA-Z\/\%μ\^0-9<>]+).*?([a-zA-Z\s,\.\-()]{3,})/,
    // Simple numeric with unit
    /([\d\.]+)\s*([a-zA-Z\/\%μ\^0-9<>]+)/
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const match = line.match(patterns[i]);
    if (match) {
      let value, unit, confidence = 0.5;
      
      // Handle different match patterns
      if (i <= 3) {
        // Parameter first patterns
        value = parseFloat(match[2]);
        unit = match[3];
        confidence = 0.8;
      } else if (i <= 5) {
        // Value first patterns
        value = parseFloat(match[1]);
        unit = match[2];
        confidence = 0.7;
      } else {
        // Simple patterns
        value = parseFloat(match[1]);
        unit = match[2];
        confidence = 0.6;
      }
      
      // Validate value
      if (isNaN(value) || value <= 0 || value > 100000) {
        continue;
      }
      
      // Clean and validate unit
      unit = unit.trim().replace(/[^a-zA-Z0-9\/\%μ\^<>]/g, '');
      
      // Check if unit matches expected units
      const matchedUnit = findBestUnitMatch(unit, possibleUnits);
      if (matchedUnit) {
        console.log(`✓ Extracted: value=${value}, unit=${matchedUnit}, confidence=${confidence}`);
        return {
          value: value,
          unit: matchedUnit,
          confidence: confidence
        };
      }
    }
  }
  
  console.log(`✗ No valid extraction from line`);
  return null;
}

// Enhanced table format extraction with better OCR handling
function extractFromTableFormatAdvanced(lines) {
  const parameters = [];
  console.log('Advanced table extraction processing...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`Processing line ${i}: "${line}"`);
    
    // Skip obvious header lines
    if (isHeaderLine(line)) {
      console.log('Skipping header line');
      continue;
    }
    
    // Enhanced table patterns with OCR error tolerance
    const tablePatterns = [
      // Pattern 1: Standard lab report table with flexible spacing
      {
        regex: /([a-zA-Z][a-zA-Z\s,\.\-()]{2,}?)\s{2,}([\d\.]+)\s{1,}([a-zA-Z\/\%μ\^0-9<>]{1,10})(?:\s+([<>\d\.\-\s]+))?/,
        nameIndex: 1, valueIndex: 2, unitIndex: 3, rangeIndex: 4
      },
      // Pattern 2: Comma separated values
      {
        regex: /([a-zA-Z][a-zA-Z\s\-()]{2,}?),\s*([\d\.]+),?\s*([a-zA-Z\/\%μ\^0-9<>]{1,10})/,
        nameIndex: 1, valueIndex: 2, unitIndex: 3
      },
      // Pattern 3: Colon format
      {
        regex: /([a-zA-Z][a-zA-Z\s\-()]{2,}?):\s*([\d\.]+)\s*([a-zA-Z\/\%μ\^0-9<>]{1,10})/,
        nameIndex: 1, valueIndex: 2, unitIndex: 3
      },
      // Pattern 4: Flexible with various separators
      {
        regex: /([a-zA-Z][a-zA-Z\s,\.\-()]{2,}?)\s*[\s\-:]*\s*([\d\.]+)\s*([a-zA-Z\/\%μ\^0-9<>]{1,10})/,
        nameIndex: 1, valueIndex: 2, unitIndex: 3
      }
    ];
    
    for (const pattern of tablePatterns) {
      const match = line.match(pattern.regex);
      if (match) {
        const name = match[pattern.nameIndex]?.trim();
        const value = parseFloat(match[pattern.valueIndex]);
        const unit = match[pattern.unitIndex]?.trim();
        const range = match[pattern.rangeIndex]?.trim();
        
        // Validate extraction
        if (name && !isNaN(value) && value > 0 && value < 10000 && unit && name.length > 2) {
          // Additional validation for health parameters
          if (isLikelyHealthParameterAdvanced(name, line)) {
            console.log(`✓ Table extraction: ${name} = ${value} ${unit}`);
            
            const parameter = {
              name: formatParameterName(name),
              value: value,
              unit: standardizeUnit(unit),
              category: determineCategory(name),
              normalRange: cleanRange(range) || 'Not available',
              status: determineStatusFromRange(value, cleanRange(range)),
              confidence: 0.8
            };
            
            parameters.push(parameter);
            break; // Don't try other patterns for this line
          }
        }
      }
    }
  }
  
  console.log(`Advanced table extraction found ${parameters.length} parameters`);
  return parameters;
}

// Medical context-aware extraction
function extractWithMedicalContext(lines) {
  const parameters = [];
  console.log('Medical context extraction...');
  
  // Look for lines that contain medical terms and numerical values
  for (const line of lines) {
    if (containsMedicalTerms(line) && containsNumericalValue(line)) {
      const extracted = extractFromMedicalLine(line);
      if (extracted) {
        parameters.push(extracted);
      }
    }
  }
  
  console.log(`Medical context extraction found ${parameters.length} parameters`);
  return parameters;
}

// Layout pattern recognition for common lab report formats
function extractFromLayoutPatterns(lines) {
  const parameters = [];
  console.log('Layout pattern recognition...');
  
  // Try to identify table structure by looking for consistent patterns
  const tableStructure = analyzeTableStructure(lines);
  
  if (tableStructure.isTable) {
    console.log('Detected table structure');
    parameters.push(...extractFromDetectedTable(lines, tableStructure));
  }
  
  console.log(`Layout pattern recognition found ${parameters.length} parameters`);
  return parameters;
}

// Advanced numeric extraction with medical significance
function extractNumericValuesAdvanced(lines) {
  const parameters = [];
  console.log('Advanced fallback numeric extraction...');
  
  for (const line of lines) {
    // Look for any meaningful numeric patterns with potential medical significance
    const numericPatterns = [
      // Medical term followed by number and unit
      /((?:cholesterol|glucose|hemoglobin|vitamin|protein|triglyceride|creatinine|albumin|bilirubin)[a-zA-Z\s]*)\s*[\s\-:]*\s*(\d+\.?\d*)\s*([a-zA-Z\/\%μ\^0-9]{1,8})/gi,
      // Number with medical unit followed by term
      /(\d+\.?\d*)\s*([a-zA-Z\/\%μ\^0-9]{1,8})\s+((?:cholesterol|glucose|hemoglobin|vitamin|protein|triglyceride|creatinine|albumin|bilirubin)[a-zA-Z\s]*)/gi,
      // Any health-looking term with number
      /([a-zA-Z\s]{3,}(?:level|count|test|result))\s*[\s\-:]*\s*(\d+\.?\d*)\s*([a-zA-Z\/\%]{1,6})/gi
    ];
    
    for (const pattern of numericPatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const name = match[1]?.trim();
        let value, unit;
        
        if (match[3] && /[a-zA-Z]/.test(match[3])) {
          // Pattern: number unit name
          value = parseFloat(match[1]);
          unit = match[2];
        } else {
          // Pattern: name number unit
          value = parseFloat(match[2]);
          unit = match[3];
        }
        
        if (name && !isNaN(value) && value > 0 && value < 10000 && unit && name.length > 2) {
          console.log(`✓ Fallback extraction: ${name} = ${value} ${unit}`);
          
          parameters.push({
            name: formatParameterName(name),
            value: value,
            unit: standardizeUnit(unit),
            category: determineCategory(name),
            normalRange: 'Not available',
            status: 'Unknown',
            confidence: 0.4
          });
        }
      }
    }
  }
  
  return parameters;
}



function determineCategory(paramName) {
  const lowerName = paramName.toLowerCase();
  
  if (lowerName.includes('cholesterol') || lowerName.includes('triglyceride') || lowerName.includes('ldl') || lowerName.includes('hdl')) {
    return 'Lipid Profile';
  }
  if (lowerName.includes('glucose') || lowerName.includes('sugar') || lowerName.includes('a1c') || lowerName.includes('hba1c')) {
    return 'Blood Sugar';
  }
  if (lowerName.includes('hemoglobin') || lowerName.includes('hgb') || lowerName.includes('rbc') || lowerName.includes('wbc') || lowerName.includes('platelet')) {
    return 'Complete Blood Count';
  }
  if (lowerName.includes('vitamin')) {
    return 'Vitamins';
  }
  if (lowerName.includes('tsh') || lowerName.includes('thyroid')) {
    return 'Thyroid Function';
  }
  if (lowerName.includes('creatinine') || lowerName.includes('urea') || lowerName.includes('bun')) {
    return 'Kidney Function';
  }
  if (lowerName.includes('albumin') || lowerName.includes('protein')) {
    return 'Liver Function';
  }
  
  return 'General';
}

function cleanRange(range) {
  if (!range || range === 'Not available') return 'Not available';
  
  // Clean up common range formats
  return range
    .replace(/bio\.\s*ref\.\s*interval/gi, '')
    .replace(/reference\s*range/gi, '')
    .replace(/normal\s*range/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function determineStatusFromRange(value, range) {
  if (!range || range === 'Not available') return 'Unknown';
  
  try {
    // Handle ranges like "<200.00", ">40.00", "13.00 - 17.00"
    if (range.includes('<')) {
      const threshold = parseFloat(range.replace('<', '').trim());
      return value <= threshold ? 'Normal' : 'High';
    } else if (range.includes('>')) {
      const threshold = parseFloat(range.replace('>', '').trim());
      return value >= threshold ? 'Normal' : 'Low';
    } else if (range.includes('-')) {
      const parts = range.split('-').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const [min, max] = parts;
        if (value < min) return 'Low';
        if (value > max) return 'High';
        return 'Normal';
      }
    }
  } catch (error) {
    console.error('Error determining status:', error);
  }
  
  return 'Unknown';
}



function formatParameterName(name) {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function determineStatus(value, normalRange) {
  if (!normalRange || normalRange === 'Not available') {
    return 'Unknown';
  }
  
  try {
    if (normalRange.includes('<')) {
      const threshold = parseFloat(normalRange.replace('<', ''));
      return value <= threshold ? 'Normal' : 'High';
    } else if (normalRange.includes('>')) {
      const threshold = parseFloat(normalRange.replace('>', ''));
      return value >= threshold ? 'Normal' : 'Low';
    } else if (normalRange.includes('-')) {
      const [min, max] = normalRange.split('-').map(v => parseFloat(v));
      if (value < min) return 'Low';
      if (value > max) return 'High';
      return 'Normal';
    }
  } catch (error) {
    console.error('Error determining status:', error);
  }
  
  return 'Unknown';
}

function calculateConfidence(pattern, line) {
  let confidence = 0.5;
  
  // Higher confidence if pattern appears at start of line
  if (line.toLowerCase().trim().startsWith(pattern.toLowerCase())) {
    confidence += 0.2;
  }
  
  // Higher confidence if line contains numbers
  if (/\d/.test(line)) {
    confidence += 0.2;
  }
  
  // Higher confidence if line contains common units
  if (/mg\/dl|mmol\/l|%|ng\/ml/i.test(line)) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1.0);
}

function removeDuplicates(parameters) {
  const seen = new Set();
  return parameters.filter(param => {
    const key = `${param.name}-${param.value}-${param.unit}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Advanced duplicate removal with confidence-based selection
function removeDuplicatesAdvanced(parameters) {
  const groupedParams = {};
  
  // Group similar parameters
  for (const param of parameters) {
    const key = `${param.name.toLowerCase()}-${param.value}`;
    if (!groupedParams[key]) {
      groupedParams[key] = [];
    }
    groupedParams[key].push(param);
  }
  
  // Select best parameter from each group
  const result = [];
  for (const group of Object.values(groupedParams)) {
    // Sort by confidence and select the best one
    group.sort((a, b) => b.confidence - a.confidence);
    result.push(group[0]);
  }
  
  return result;
}

// Fuzzy string matching function
function fuzzyMatch(str1, str2, threshold = 0.7) {
  if (str1 === str2) return true;
  if (str1.length < 3 || str2.length < 3) return false;
  
  const distance = levenshtein(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  const similarity = 1 - (distance / maxLen);
  
  return similarity >= threshold;
}

// Find best unit match from possible units
function findBestUnitMatch(unit, possibleUnits) {
  unit = unit.toLowerCase().trim();
  
  // Direct match first
  for (const possibleUnit of possibleUnits) {
    if (unit === possibleUnit.toLowerCase()) {
      return possibleUnit;
    }
  }
  
  // Fuzzy match
  for (const possibleUnit of possibleUnits) {
    if (fuzzyMatch(unit, possibleUnit.toLowerCase(), 0.8)) {
      return possibleUnit;
    }
  }
  
  // Common variations
  const unitVariations = {
    'mg/dl': ['mgdl', 'mg dl', 'mg/dl', 'mg/l', 'milligram/deciliter'],
    'g/dl': ['gdl', 'g dl', 'g/dl', 'gram/deciliter'],
    'mmol/l': ['mmoll', 'mmol l', 'mmol/l', 'millimole/liter'],
    '%': ['percent', 'pct', '%', 'percentage'],
    'ng/ml': ['ngml', 'ng ml', 'ng/ml', 'nanogram/milliliter'],
    'pg/ml': ['pgml', 'pg ml', 'pg/ml', 'picogram/milliliter']
  };
  
  for (const [standardUnit, variations] of Object.entries(unitVariations)) {
    if (variations.some(variation => unit.includes(variation.toLowerCase()) || variation.toLowerCase().includes(unit))) {
      if (possibleUnits.includes(standardUnit)) {
        return standardUnit;
      }
    }
  }
  
  return null;
}

// Check if line is a header line
function isHeaderLine(line) {
  const headerPatterns = [
    /test\s+name/i,
    /parameter/i,
    /result/i,
    /unit/i,
    /reference\s+range/i,
    /normal\s+range/i,
    /bio\s+ref/i,
    /lab\s+report/i,
    /^[\s\-=]+$/
  ];
  
  return headerPatterns.some(pattern => pattern.test(line));
}

// Enhanced health parameter detection
function isLikelyHealthParameterAdvanced(name, fullLine = '') {
  const healthKeywords = [
    'glucose', 'cholesterol', 'hemoglobin', 'vitamin', 'protein', 'blood',
    'serum', 'plasma', 'urine', 'thyroid', 'hormone', 'enzyme', 'count',
    'level', 'test', 'triglyceride', 'creatinine', 'urea', 'albumin',
    'hdl', 'ldl', 'vldl', 'non-hdl', 'rbc', 'wbc', 'pcv', 'mcv', 'mch', 
    'mchc', 'rdw', 'neutrophil', 'lymphocyte', 'monocyte', 'eosinophil', 
    'basophil', 'leucocyte', 'leukocyte', 'platelet', 'hematocrit',
    'bilirubin', 'calcium', 'sodium', 'potassium', 'chloride', 'iron',
    'ferritin', 'b12', 'folate', 'tsh', 'total', 'free', 'index',
    'glycated', 'a1c', 'hba1c', 'lipid', 'profile'
  ];
  
  const lowerName = name.toLowerCase();
  const lowerLine = fullLine.toLowerCase();
  
  // Check for health keywords in name or line
  const hasHealthKeyword = healthKeywords.some(keyword => 
    lowerName.includes(keyword) || lowerLine.includes(keyword)
  );
  
  // Exclude obvious non-health parameters
  const excludeKeywords = [
    'test name', 'result', 'unit', 'reference', 'range', 'interval',
    'bio', 'ref', 'page', 'report', 'date', 'time', 'patient', 'doctor',
    'printed', 'collected', 'received', 'lab', 'hospital', 'clinic'
  ];
  
  const hasExcludeKeyword = excludeKeywords.some(keyword => 
    lowerName.includes(keyword) || lowerLine.includes(keyword)
  );
  
  // Additional checks for medical context
  const hasNumericalValue = /\d/.test(fullLine);
  const hasUnit = /mg|dl|mmol|percent|%|ng|pg|fl|g\/dl|g\/l/i.test(fullLine);
  
  return hasHealthKeyword && !hasExcludeKeyword && name.length >= 3 && 
         (hasNumericalValue || hasUnit);
}

// Standardize unit formatting
function standardizeUnit(unit) {
  const standardUnits = {
    'mgdl': 'mg/dL',
    'mg dl': 'mg/dL',
    'mg/dl': 'mg/dL',
    'gdl': 'g/dL',
    'g dl': 'g/dL',
    'g/dl': 'g/dL',
    'mmoll': 'mmol/L',
    'mmol l': 'mmol/L',
    'mmol/l': 'mmol/L',
    'percent': '%',
    'pct': '%',
    'ngml': 'ng/mL',
    'ng ml': 'ng/mL',
    'ng/ml': 'ng/mL',
    'pgml': 'pg/mL',
    'pg ml': 'pg/mL',
    'pg/ml': 'pg/mL'
  };
  
  const lowerUnit = unit.toLowerCase().trim();
  return standardUnits[lowerUnit] || unit;
}

// Check if line contains medical terms
function containsMedicalTerms(line) {
  const medicalTerms = [
    'cholesterol', 'glucose', 'hemoglobin', 'triglyceride', 'protein',
    'creatinine', 'bilirubin', 'albumin', 'vitamin', 'thyroid', 'hormone',
    'blood', 'serum', 'plasma', 'count', 'level', 'hdl', 'ldl', 'vldl'
  ];
  
  const lowerLine = line.toLowerCase();
  return medicalTerms.some(term => lowerLine.includes(term));
}

// Check if line contains numerical values
function containsNumericalValue(line) {
  return /\d+\.?\d*/.test(line);
}

// Extract from medical line
function extractFromMedicalLine(line) {
  const patterns = [
    /([a-zA-Z\s,\.\-()]+?)\s*[:=\-]\s*([\d\.]+)\s*([a-zA-Z\/\%μ\^0-9]+)/,
    /([\d\.]+)\s*([a-zA-Z\/\%μ\^0-9]+)\s+([a-zA-Z\s,\.\-()]+)/
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      let name, value, unit;
      
      if (match[3] && /[a-zA-Z]/.test(match[3])) {
        // Pattern: value unit name
        value = parseFloat(match[1]);
        unit = match[2];
        name = match[3];
      } else {
        // Pattern: name value unit
        name = match[1];
        value = parseFloat(match[2]);
        unit = match[3];
      }
      
      if (name && !isNaN(value) && value > 0 && unit && name.length > 2) {
        return {
          name: formatParameterName(name.trim()),
          value: value,
          unit: standardizeUnit(unit),
          category: determineCategory(name),
          normalRange: 'Not available',
          status: 'Unknown',
          confidence: 0.6
        };
      }
    }
  }
  
  return null;
}

// Analyze table structure
function analyzeTableStructure(lines) {
  const structure = { isTable: false, columns: 0, separator: null };
  
  // Look for consistent patterns across multiple lines
  let consistentSpacing = 0;
  let consistentTabs = 0;
  let consistentCommas = 0;
  
  for (const line of lines.slice(0, 10)) { // Check first 10 lines
    if (line.includes('\t')) consistentTabs++;
    if (line.includes(',')) consistentCommas++;
    if (/\s{3,}/.test(line)) consistentSpacing++;
  }
  
  if (consistentTabs > 3) {
    structure.isTable = true;
    structure.separator = '\t';
  } else if (consistentCommas > 3) {
    structure.isTable = true;
    structure.separator = ',';
  } else if (consistentSpacing > 3) {
    structure.isTable = true;
    structure.separator = 'space';
  }
  
  return structure;
}

// Extract from detected table
function extractFromDetectedTable(lines, structure) {
  const parameters = [];
  
  for (const line of lines) {
    if (isHeaderLine(line)) continue;
    
    let columns;
    if (structure.separator === '\t') {
      columns = line.split('\t');
    } else if (structure.separator === ',') {
      columns = line.split(',');
    } else {
      columns = line.split(/\s{2,}/); // Split on multiple spaces
    }
    
    columns = columns.map(col => col.trim()).filter(col => col.length > 0);
    
    if (columns.length >= 3) {
      const name = columns[0];
      const value = parseFloat(columns[1]);
      const unit = columns[2];
      
      if (name && !isNaN(value) && value > 0 && unit && 
          isLikelyHealthParameterAdvanced(name, line)) {
        parameters.push({
          name: formatParameterName(name),
          value: value,
          unit: standardizeUnit(unit),
          category: determineCategory(name),
          normalRange: columns[3] || 'Not available',
          status: determineStatusFromRange(value, columns[3]),
          confidence: 0.7
        });
      }
    }
  }
  
  return parameters;
}

module.exports = {
  extractHealthParameters,
  HEALTH_PARAMETERS
};
