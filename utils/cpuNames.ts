import type { CpuLevel } from '../types'

const weakMale = ['たろう', 'はなお', 'けんた', 'りょう', 'だいき']
const weakFemale = ['はなこ', 'さくら', 'あかり', 'ゆい', 'みく']
const normalMale = ['しんじ', 'ゆうた', 'こうへい', 'まさき', 'りょうた']
const normalFemale = ['あやか', 'なつみ', 'まなみ', 'ひとみ', 'かおり']
const strongMale = ['けんいち', 'りゅうじ', 'たかし', 'まさお', 'ひろし']
const strongFemale = ['れいこ', 'きょうこ', 'なおみ', 'よしこ', 'みちこ']

export function getRandomCpuName(level: CpuLevel): string {
  const isMale = Math.random() < 0.5
  const pool = {
    weak: isMale ? weakMale : weakFemale,
    normal: isMale ? normalMale : normalFemale,
    strong: isMale ? strongMale : strongFemale,
  }[level]
  return pool[Math.floor(Math.random() * pool.length)]
}
