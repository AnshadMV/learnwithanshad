// Generate supabase/seed.sql with all 28 Arabic letters, forms, and 840 letter examples

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ARABIC_LETTERS } from '../src/data/arabicLetters.js'
import { LETTER_EXAMPLES } from '../src/data/letterExamples.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let sql = `-- Arabic Learning Adventure Seed Data
-- 28 Arabic letters, all written forms, and 840 verified vocabulary examples

-- Insert 28 Arabic Letters
INSERT INTO public.arabic_letters (id, letter, name_arabic, name_english, transliteration, order_index, connects_following)
VALUES\n`

const letterLines = ARABIC_LETTERS.map(
  l =>
    `  ('${l.id}', '${l.letter}', '${l.name_arabic}', '${l.name_english}', '${l.transliteration}', ${l.order_index}, ${l.connects_following})`
)
sql += letterLines.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n'

-- Insert Letter Forms
sql += `-- Insert 4 Written Forms per Letter
INSERT INTO public.letter_forms (letter_id, form_type, character, example_word, example_word_meaning)
VALUES\n`

const formLines = []
ARABIC_LETTERS.forEach(l => {
  formLines.push(`  ('${l.id}', 'isolated', '${l.forms.isolated}', '${l.letter}', 'Isolated form')`)
  formLines.push(`  ('${l.id}', 'initial', '${l.forms.initial}', '${l.forms.initial}', 'Initial form')`)
  formLines.push(`  ('${l.id}', 'medial', '${l.forms.medial}', '${l.forms.medial}', 'Medial form')`)
  formLines.push(`  ('${l.id}', 'final', '${l.forms.final}', '${l.forms.final}', 'Final form')`)
})
sql += formLines.join(',\n') + ';\n\n'

-- Insert 840 Letter Examples
sql += `-- Insert 840 Letter Examples (30 per letter)
INSERT INTO public.letter_examples (id, letter_id, arabic_word, transliteration, english_meaning, letter_position, child_explanation, verified)
VALUES\n`

const exampleLines = LETTER_EXAMPLES.map(ex => {
  const cleanMeaning = ex.english_meaning.replace(/'/g, "''")
  const cleanExpl = (ex.child_explanation || '').replace(/'/g, "''")
  return `  ('${ex.id}', '${ex.letter_id}', '${ex.arabic_word}', '${ex.transliteration}', '${cleanMeaning}', '${ex.letter_position}', '${cleanExpl}', true)`
})
sql += exampleLines.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n'

const targetPath = path.resolve(__dirname, '../supabase/seed.sql')
fs.writeFileSync(targetPath, sql, 'utf8')
console.log(`Successfully wrote seed.sql with ${LETTER_EXAMPLES.length} examples`)
