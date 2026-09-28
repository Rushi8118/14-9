/**
 * Generate-score-regenerate loop for AI-written pages.
 *
 * The rule this enforces: nothing is published until it is measurably
 * different from every page already on the site. AI generation fails by
 * producing fluent prose with identical substance, which reads as original
 * and scores ~0.9 once entity names are neutralised. Reviewing drafts by eye
 * does not catch that; this does.
 *
 * The loop is deliberately allowed to give up. A candidate that cannot beat
 * the threshold after `maxAttempts` is REJECTED, not published with a shrug -
 * if the model cannot say anything new about a country, that page has no
 * reason to exist and the honest outcome is to leave it noindexed.
 */
import { FAIL_AT, MIN_WORDS, fingerprint, scoreAgainstCorpus } from './similarity.mjs'

/**
 * @param {object} opts
 * @param {string} opts.route            Route the candidate will live at.
 * @param {(attempt:number, feedback:string|null) => Promise<string>} opts.generate
 *        Produces candidate text. `feedback` names the page it collided with
 *        on the previous attempt so the prompt can steer away from it.
 * @param {Array<{route:string,words:number,sh:Set<string>}>} opts.corpus
 * @param {number} [opts.maxAttempts]
 * @param {number} [opts.failAt]
 * @param {number} [opts.minWords]
 * @param {(msg:string) => void} [opts.log]
 */
export async function generateUntilDistinct({
  route,
  generate,
  corpus,
  vocab = null,
  maxAttempts = 3,
  failAt = FAIL_AT,
  minWords = MIN_WORDS,
  log = () => {},
}) {
  const attempts = []
  let feedback = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const text = (await generate(attempt, feedback)) ?? ''
    const fp = fingerprint(route, text, vocab)
    const { worst, worstAgainst } = scoreAgainstCorpus(fp, corpus, failAt)
    const tooThin = fp.words < minWords
    const tooSimilar = worst >= failAt

    attempts.push({ attempt, words: fp.words, worst, worstAgainst })
    log(
      `  attempt ${attempt}: ${fp.words} words, worst ${worst.toFixed(3)}` +
      (worstAgainst ? ` vs ${worstAgainst}` : '') +
      (tooThin ? ' [THIN]' : '') + (tooSimilar ? ' [DUPLICATE]' : ''),
    )

    if (!tooThin && !tooSimilar) {
      return { ok: true, text, route, words: fp.words, worst, worstAgainst, attempts, fingerprint: fp }
    }

    const reasons = []
    if (tooSimilar) {
      reasons.push(
        `It was ${(worst * 100).toFixed(0)}% the same as ${worstAgainst} once country names were ` +
        'removed. Do not reuse the structure, section order or generic phrasing. ' +
        'Replace generic statements with facts true only of this route: the official visa name, ' +
        'the actual salary threshold, the real processing time, named authorities and documents.',
      )
    }
    if (tooThin) {
      reasons.push(`It was only ${fp.words} words; at least ${minWords} of substantive content are required.`)
    }
    feedback = reasons.join(' ')
  }

  const best = attempts.reduce((a, b) => (b.worst < a.worst ? b : a))
  return { ok: false, route, attempts, best, reason: 'Could not produce distinct content within attempt limit' }
}
