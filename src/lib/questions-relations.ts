// src/lib/questions-relations.ts
import type { Relationship } from '@/types';
import { extraQuestions } from '@/lib/questions-newpairs';

export type RelationSide = 'p1' | 'p2'
export interface RelationQuestion { id: string; text: string; bucket: string }

/**
 * We keep raw text lists without IDs, then generate
 * stable, unique IDs like "kid-parent:p1:001".
 */
type RawQ = { text: string; bucket: string }
type RawBySide = { p1: RawQ[]; p2: RawQ[] }
type RawAll = Record<Relationship, RawBySide>

const pad3 = (n: number) => n.toString().padStart(3, '0')
const makeId = (rel: Relationship, side: RelationSide, idx: number) =>
  `${rel}:${side}:${pad3(idx + 1)}`

/** Map raw → questions with deterministic unique IDs */
function bake(raw: RawAll): Record<Relationship, Record<RelationSide, RelationQuestion[]>> {
  const out = {} as Record<Relationship, Record<RelationSide, RelationQuestion[]>>
  (Object.keys(raw) as Relationship[]).forEach((rel) => {
    out[rel] = { p1: [], p2: [] }
    ;(['p1','p2'] as RelationSide[]).forEach((side) => {
      out[rel][side] = raw[rel][side].map((q, i) => ({
        id: makeId(rel, side, i),
        text: q.text,
        bucket: q.bucket
      }))
    })
  })
  return out
}

/* ──────────────────────────────────────────────────────────────
   RAW QUESTION BANK
   NOTE: Each side currently has ~30 prompts for brevity here.
   You can safely append to reach 60 by adding more RawQ entries.
   IDs will be regenerated automatically & remain stable.
   ────────────────────────────────────────────────────────────── */

const raw: RawAll = {
  'kid-parent': {
    // P1 = Kid asking Parent  (add more to reach 60)
    p1: [
      { text: "What's the funniest thing I did as a toddler that you still laugh about?", bucket: 'memories' },
      { text: "If our family had a theme song, what would it be—and why?", bucket: 'fun' },
      { text: "Tell me a story about when you were my age—what was your favorite snack?", bucket: 'childhood' },
      { text: "What tiny thing do I do that secretly makes you proud?", bucket: 'pride' },
      { text: "What family rule makes the least sense—and should we replace it with a sillier one?", bucket: 'house' },
      { text: "Describe our perfect lazy Sunday—minute by minute.", bucket: 'routine' },
      { text: "What did you think I would be obsessed with—but I surprised you?", bucket: 'surprise' },
      { text: "What's a joke I told that you actually loved?", bucket: 'humor' },
      { text: "What chore am I secretly great at (even if I complain)?", bucket: 'home' },
      { text: "If I could borrow one of your superpowers, which should it be?", bucket: 'superpowers' },
      { text: "When did you realize our family is wonderfully weird?", bucket: 'identity' },
      { text: "Tell me about a time I made your day better without knowing it.", bucket: 'kindness' },
      { text: "What school subject did you not like—but wish you did?", bucket: 'school' },
      { text: "What is a food you loved as a kid that I might like to try?", bucket: 'food' },
      { text: "What's a family tradition you'd love us to start this year?", bucket: 'tradition' },
      { text: "If our pet could talk for one minute, what would it say about me?", bucket: 'pets' },
      { text: "What's something you wish you had learned earlier that I can learn now?", bucket: 'advice' },
      { text: "Which emoji describes me at breakfast? Explain with evidence.", bucket: 'fun' },
      { text: "When do I remind you most of yourself?", bucket: 'likeness' },
      { text: "What's a tiny habit that makes our home happier?", bucket: 'home' },
      { text: "Tell me a story about a silly mistake that turned into a great memory.", bucket: 'memories' },
      { text: "What is your secret recipe for cheering me up?", bucket: 'care' },
      { text: "If we swapped roles for a day, what would you do first?", bucket: 'imagination' },
      { text: "What's something I do now that future-me will be proud of?", bucket: 'future' },
      { text: "What song should we dance to right after this recording?", bucket: 'fun' },
      { text: "What chore would you gladly trade with me—and why?", bucket: 'home' },
      { text: "What's a family nickname I should absolutely never lose?", bucket: 'identity' },
      { text: "If our fridge could talk, what gossip would it share about us?", bucket: 'fun' },
      { text: "What is your favorite way that I show kindness?", bucket: 'kindness' },
      { text: "Describe your favorite place at home and what makes it cozy.", bucket: 'home' }
    ],
    // P2 = Parent asking Kid  (add more to reach 60)
    p2: [
      { text: "What made you proud of yourself this week?", bucket: 'pride' },
      { text: "Tell me about something brave you did recently.", bucket: 'bravery' },
      { text: "If we start a new bedtime ritual, what should it be?", bucket: 'ritual' },
      { text: "What household job do you secretly enjoy?", bucket: 'home' },
      { text: "What is one rule you’d tweak a little—why?", bucket: 'fun' },
      { text: "Teach me your quickest way to turn a bad day around.", bucket: 'advice' },
      { text: "What made your favorite teacher so memorable?", bucket: 'school' },
      { text: "What is the silliest outfit you’d wear again on purpose?", bucket: 'humor' },
      { text: "Tell me a story about a time you laughed so hard you cried.", bucket: 'memories' },
      { text: "What is something you do that makes our home kinder?", bucket: 'kindness' },
      { text: "What adventure should we plan together this month?", bucket: 'adventure' },
      { text: "What snack should always be in the pantry for emergency joy?", bucket: 'food' },
      { text: "When did you realize you were growing up—and how did it feel?", bucket: 'growing' },
      { text: "Which of your jokes deserves a trophy?", bucket: 'humor' },
      { text: "What tiny habit helps you stay calm on busy days?", bucket: 'habits' },
      { text: "What do you hope future-you remembers about our family?", bucket: 'future' },
      { text: "If our pet kept a diary, what would it write about you today?", bucket: 'pets' },
      { text: "Tell me about a small kindness that meant a lot to you.", bucket: 'kindness' },
      { text: "What's a movie you love that we should watch together?", bucket: 'media' },
      { text: "If we could time-travel for one afternoon, where would we go?", bucket: 'imagination' },
      { text: "What word best describes our family energy—and why?", bucket: 'identity' },
      { text: "What's a small tradition we could revive at home?", bucket: 'tradition' },
      { text: "When did you feel most supported by someone this month?", bucket: 'support' },
      { text: "What talent do you have that almost no one knows about?", bucket: 'talent' },
      { text: "What would a perfect after-school hangout look like?", bucket: 'routine' },
      { text: "If you could gift me one life tip, what would it be?", bucket: 'advice' },
      { text: "What sound instantly feels like home to you?", bucket: 'senses' },
      { text: "What was your funniest kitchen experiment?", bucket: 'food' },
      { text: "When do you feel most ‘seen’ by me?", bucket: 'connection' },
      { text: "Describe your favorite cozy corner growing up.", bucket: 'home' }
    ]
  },

  'adultchild-parent': {
    // P1 = Adult Child asking Parent  (add more to reach 60)
    p1: [
      { text: "What is something you were right about that I only admit now?", bucket: 'truths' },
      { text: "What cheap meal from my childhood still slaps?", bucket: 'food' },
      { text: "What did you worry about with me that turned out great?", bucket: 'reassurance' },
      { text: "Tell me a small parenting hack you wish you discovered sooner.", bucket: 'advice' },
      { text: "What's our funniest miscommunication of all time?", bucket: 'humor' },
      { text: "When did you realize I had become your equal in something?", bucket: 'growth' },
      { text: "What tradition should we keep even if we live far apart?", bucket: 'tradition' },
      { text: "What's a story you want me to pass down someday?", bucket: 'legacy' },
      { text: "What everyday thing about me makes you proud now?", bucket: 'pride' },
      { text: "What music from your era do you insist I appreciate?", bucket: 'music' },
      { text: "What do you miss from when I lived at home?", bucket: 'nostalgia' },
      { text: "Describe our best road-trip moment in 30 seconds.", bucket: 'memories' },
      { text: "What is an opinion you changed because of me?", bucket: 'learning' },
      { text: "What tiny luxury should be non-negotiable in life?", bucket: 'joy' },
      { text: "What little thing do I do that reminds you of your younger self?", bucket: 'likeness' },
      { text: "If we started a two-person book club, what’s book #1?", bucket: 'media' },
      { text: "When did you feel most supported by me recently?", bucket: 'support' },
      { text: "What’s a ridiculous family debate you still defend?", bucket: 'humor' },
      { text: "If we had a signature drink, what’s in it (mocktail allowed)?", bucket: 'fun' },
      { text: "What habit of yours should I steal immediately?", bucket: 'habits' },
      { text: "What gift did I give you that landed perfectly?", bucket: 'gifts' },
      { text: "What do you hope future-me brags about?", bucket: 'future' },
      { text: "Tell me a time you were hilariously wrong (bonus points if about me).", bucket: 'humor' },
      { text: "What’s a recipe I should learn exactly the way you make it?", bucket: 'food' },
      { text: "What smell instantly takes you back to our old place?", bucket: 'senses' },
      { text: "What movie did we over-quote the most?", bucket: 'media' },
      { text: "What’s a tiny boundary that improved our relationship?", bucket: 'boundaries' },
      { text: "What have you learned from watching me adult?", bucket: 'learning' },
      { text: "Complete the sentence: Our family is unstoppable when ___", bucket: 'identity' },
      { text: "What’s the nicest petty win you’ve had against me?", bucket: 'humor' }
    ],
    // P2 = Parent asking Adult Child  (add more to reach 60)
    p2: [
      { text: "What’s something I did as a parent that actually worked?", bucket: 'parenting' },
      { text: "When did you realize you no longer needed my permission?", bucket: 'growth' },
      { text: "Which of your talents came from me—be honest?", bucket: 'talent' },
      { text: "What’s a family myth you now know was exaggerated (or true)?", bucket: 'stories' },
      { text: "What do you think I’m secretly brilliant at?", bucket: 'praise' },
      { text: "What was the moment you felt most proud of yourself recently?", bucket: 'pride' },
      { text: "Teach me a life hack you learned that I never did.", bucket: 'advice' },
      { text: "If we ran a tiny family business, what would we sell?", bucket: 'fun' },
      { text: "What tradition do you want to pass to the next generation?", bucket: 'tradition' },
      { text: "What’s a playlist we should build together?", bucket: 'music' },
      { text: "What did I underestimate about you?", bucket: 'respect' },
      { text: "What makes our conversations special now compared to before?", bucket: 'connection' },
      { text: "What’s the funniest autocorrect fail in our family chat?", bucket: 'humor' },
      { text: "If we could relive one ordinary day from the past, which one?", bucket: 'nostalgia' },
      { text: "What did you teach me without realizing it?", bucket: 'learning' },
      { text: "What’s a boundary I set that you appreciate now?", bucket: 'boundaries' },
      { text: "What small kindness from me landed at the perfect time?", bucket: 'kindness' },
      { text: "If you wrote a toast about our family, what’s the opener?", bucket: 'speech' },
      { text: "What’s something about me that aged like fine wine?", bucket: 'humor' },
      { text: "What everyday ritual keeps you grounded?", bucket: 'routine' },
      { text: "What’s a tiny splurge you endorse 100%?", bucket: 'joy' },
      { text: "What fear did you outgrow? How?", bucket: 'courage' },
      { text: "What would our two-person podcast be called?", bucket: 'fun' },
      { text: "What should I brag about you to my friends?", bucket: 'praise' },
      { text: "What do you hope stays the same about us in 10 years?", bucket: 'future' },
      { text: "What recipe from me do you secretly improve?", bucket: 'food' },
      { text: "What’s a topic you can talk about for hours?", bucket: 'passion' },
      { text: "What tradition should we retire gracefully?", bucket: 'tradition' },
      { text: "What’s your most wholesome bad habit?", bucket: 'humor' },
      { text: "Complete the sentence: We’re at our best when ___.", bucket: 'identity' }
    ]
  },

  'friend-friend': {
    // P1 = Friend A  (add more to reach 60)
    p1: [
      { text: "What’s our origin story—give me the cinematic version.", bucket: 'memories' },
      { text: "What inside joke still makes you giggle in public?", bucket: 'humor' },
      { text: "What friend superpower do I bring to the team?", bucket: 'praise' },
      { text: "Pitch our two-person heist (no crimes—just snacks).", bucket: 'fun' },
      { text: "What song is absolutely ‘us’ and why?", bucket: 'music' },
      { text: "What’s a small way we make each other braver?", bucket: 'support' },
      { text: "Tell the story of our most wholesome chaos.", bucket: 'memories' },
      { text: "What do I bring to a road trip that upgrades the vibe?", bucket: 'travel' },
      { text: "When did you know we’d be lifelong friends?", bucket: 'bond' },
      { text: "What is our signature snack combo?", bucket: 'food' },
      { text: "What compliment do I need to hear more often?", bucket: 'kindness' },
      { text: "Which of my takes aged like fine wine?", bucket: 'humor' },
      { text: "What trip should we plan that costs under $50?", bucket: 'fun' },
      { text: "What skill of yours should I shamelessly steal?", bucket: 'learning' },
      { text: "What ‘we’ tradition should we start this season?", bucket: 'tradition' },
      { text: "Tell me about a time I had your back.", bucket: 'support' },
      { text: "What store would we get banned from (for laughing)?", bucket: 'humor' },
      { text: "What tiny thing I do makes your day better?", bucket: 'kindness' },
      { text: "What’s a brag about you I should use more?", bucket: 'praise' },
      { text: "What hobby should we try together for one week?", bucket: 'hobbies' },
      { text: "What game do I absolutely underestimate you in?", bucket: 'games' },
      { text: "Describe our friendship as a weather forecast.", bucket: 'fun' },
      { text: "What podcast would we accidentally start?", bucket: 'fun' },
      { text: "What phrase do I overuse—and love me for it anyway.", bucket: 'humor' },
      { text: "What is the most ‘you’ gift I could give you under $10?", bucket: 'gifts' },
      { text: "When do I inspire you the most?", bucket: 'inspiration' },
      { text: "What is our official friendship holiday?", bucket: 'tradition' },
      { text: "What’s a memory that lives rent-free in your brain (in a good way)?", bucket: 'memories' },
      { text: "What chore would we be terrible at together?", bucket: 'humor' },
      { text: "Write our friendship’s tagline in seven words.", bucket: 'identity' }
    ],
    // P2 = Friend B  (add more to reach 60)
    p2: [
      { text: "What’s your favorite ‘only we would think this is funny’ moment?", bucket: 'humor' },
      { text: "What snack do I introduce that always wins the room?", bucket: 'food' },
      { text: "What do you admire about how I handle stress?", bucket: 'praise' },
      { text: "If we hosted a tiny festival, what’s its name?", bucket: 'fun' },
      { text: "What city would we absolutely thrive in for a weekend?", bucket: 'travel' },
      { text: "What’s the best advice you accidentally gave me?", bucket: 'advice' },
      { text: "Tell me a mini-moment where you felt seen by me.", bucket: 'connection' },
      { text: "What tradition should we bring back from our early days?", bucket: 'tradition' },
      { text: "What’s our most elite meme reference?", bucket: 'humor' },
      { text: "What role do I play in our duo that people miss?", bucket: 'identity' },
      { text: "What would you put on our two-song EP?", bucket: 'music' },
      { text: "What small ritual should future-us never skip?", bucket: 'routine' },
      { text: "When did we win as a team recently?", bucket: 'wins' },
      { text: "What weird hill did we both decide to die on?", bucket: 'humor' },
      { text: "What’s a compliment you forget to give me?", bucket: 'kindness' },
      { text: "If we ran a pop-up shop, what would we sell?", bucket: 'fun' },
      { text: "What do I do that always breaks the ice?", bucket: 'praise' },
      { text: "What is our minimalist travel kit?", bucket: 'travel' },
      { text: "Tell a quick story where we were unintentionally hilarious.", bucket: 'memories' },
      { text: "What’s a tiny challenge we should attempt this week?", bucket: 'hobbies' },
      { text: "What’s our friendship superpower in one sentence?", bucket: 'identity' },
      { text: "What movie do we quote too much but won’t stop?", bucket: 'media' },
      { text: "What’s the last time I made you laugh-snort?", bucket: 'humor' },
      { text: "What’s a memory we should re-create on purpose?", bucket: 'memories' },
      { text: "What tiny thing about me deserves a standing ovation?", bucket: 'praise' },
      { text: "What hobby should I never quit?", bucket: 'hobbies' },
      { text: "What is the most ‘us’ photo we’ve taken?", bucket: 'memories' },
      { text: "What’s a wholesome prank we should plan?", bucket: 'fun' },
      { text: "What moment made our friendship feel unshakable?", bucket: 'bond' },
      { text: "Write a supportive pep-talk line for me.", bucket: 'support' }
    ]
  },

  'kid-grandparent': {
    // P1 = Kid asking Grandparent  (add more to reach 60)
    p1: [
      { text: "What game did you love as a kid that I should learn?", bucket: 'childhood' },
      { text: "Tell me about a funny rule your parents had.", bucket: 'family' },
      { text: "What was your coolest snack or candy when you were my age?", bucket: 'food' },
      { text: "What toy would past-you be jealous I have now?", bucket: 'fun' },
      { text: "What was the silliest fashion when you were little?", bucket: 'humor' },
      { text: "What is a song from your childhood I should hear?", bucket: 'music' },
      { text: "What did you do after school for fun?", bucket: 'childhood' },
      { text: "What smell reminds you of home growing up?", bucket: 'senses' },
      { text: "What animal story from your life always makes people smile?", bucket: 'pets' },
      { text: "What made you laugh so hard as a kid?", bucket: 'humor' },
      { text: "What rule should we make up for our hangouts?", bucket: 'tradition' },
      { text: "What is a tiny piece of advice I can try this week?", bucket: 'advice' },
      { text: "What was your favorite rainy-day activity?", bucket: 'childhood' },
      { text: "Tell me about a time you felt brave as a kid.", bucket: 'bravery' },
      { text: "What dessert should we make together soon?", bucket: 'food' },
      { text: "What is a toy or gadget you wish existed back then?", bucket: 'imagination' },
      { text: "Teach me a secret handshake or greeting!", bucket: 'fun' },
      { text: "What was your best school lunch trade?", bucket: 'school' },
      { text: "What animal would you have as a magical pet?", bucket: 'imagination' },
      { text: "What nice thing can I do that would make you smile big?", bucket: 'kindness' },
      { text: "What place near home felt like adventure land?", bucket: 'memories' },
      { text: "What was your funniest sports moment?", bucket: 'humor' },
      { text: "What is a family story I should memorize?", bucket: 'legacy' },
      { text: "What should be our official snack when we hang out?", bucket: 'food' },
      { text: "What cartoon did everyone watch then?", bucket: 'media' },
      { text: "What is a pocket-sized skill you can teach me?", bucket: 'skills' },
      { text: "What made your best friend special back then?", bucket: 'friendship' },
      { text: "What is a nice habit I can practice daily?", bucket: 'habits' },
      { text: "What do you think I’ll be amazing at when I’m older?", bucket: 'future' },
      { text: "Tell me the story of a tiny victory that meant a lot.", bucket: 'wins' }
    ],
    // P2 = Grandparent asking Kid  (add more to reach 60)
    p2: [
      { text: "What is something you do that makes me giggle every time?", bucket: 'humor' },
      { text: "What new thing did you learn recently that surprised you?", bucket: 'learning' },
      { text: "What game should we invent together?", bucket: 'fun' },
      { text: "What kindness did you show someone this week?", bucket: 'kindness' },
      { text: "What is your current top snack—and why is it unbeatable?", bucket: 'food' },
      { text: "What makes a perfect grandparent-kid day?", bucket: 'routine' },
      { text: "What talent of yours do I need to brag about to my friends?", bucket: 'praise' },
      { text: "What silly face should be our official selfie?", bucket: 'humor' },
      { text: "What is your favorite way to help at home?", bucket: 'home' },
      { text: "What makes you feel big and brave lately?", bucket: 'bravery' },
      { text: "What tradition should we start for our calls/visits?", bucket: 'tradition' },
      { text: "What song should we sing loudly together soon?", bucket: 'music' },
      { text: "What’s a joke I should learn so I can tell it to you later?", bucket: 'humor' },
      { text: "What was the best part of your week—and why?", bucket: 'wins' },
      { text: "What nice thing did someone do for you that you want to pass on?", bucket: 'kindness' },
      { text: "If we built a secret fort, what would the rules be?", bucket: 'fun' },
      { text: "What superpower would you choose for one day?", bucket: 'imagination' },
      { text: "What makes our time together special to you?", bucket: 'connection' },
      { text: "What silly award should I give you right now?", bucket: 'humor' },
      { text: "What makes you feel most loved at home?", bucket: 'home' },
      { text: "What should we cook or bake next visit?", bucket: 'food' },
      { text: "What is your best dance move called?", bucket: 'fun' },
      { text: "When do you feel like a great friend?", bucket: 'friendship' },
      { text: "What do you want to teach me next time?", bucket: 'skills' },
      { text: "If we had a mascot, what would it be?", bucket: 'fun' },
      { text: "What makes school most fun right now?", bucket: 'school' },
      { text: "What is a small goal you’re excited about?", bucket: 'future' },
      { text: "What is your favorite thing about our family?", bucket: 'identity' },
      { text: "What helps when you feel wobbly?", bucket: 'advice' },
      { text: "What silly tradition should we invent for birthdays?", bucket: 'tradition' }
    ]
  }
}

export const questions = bake(raw)
Object.assign(questions as any, extraQuestions);

export function getRandomQuestionFor(rel: Relationship, side: RelationSide): RelationQuestion {
  const pool = questions[rel][side]
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx]
}
