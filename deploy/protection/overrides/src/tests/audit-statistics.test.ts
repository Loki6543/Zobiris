import {describe,it,expect} from 'vitest';
import {pboFromSplitMatrix} from '../strategy21/researchIntegrity/statistics.js';

describe('conservative PBO handling',()=>{
 it('counts median out-of-sample performance as overfit in a three-candidate split',()=>{
  const rows=[
   {splitId:'one',candidateId:'A',role:'IN_SAMPLE' as const,value:30},
   {splitId:'one',candidateId:'B',role:'IN_SAMPLE' as const,value:20},
   {splitId:'one',candidateId:'C',role:'IN_SAMPLE' as const,value:10},
   {splitId:'one',candidateId:'A',role:'OUT_OF_SAMPLE' as const,value:2},
   {splitId:'one',candidateId:'B',role:'OUT_OF_SAMPLE' as const,value:1},
   {splitId:'one',candidateId:'C',role:'OUT_OF_SAMPLE' as const,value:3},
  ];
  expect(pboFromSplitMatrix(rows,3)).toMatchObject({validSplits:1,pbo:1,logits:[0]});
 });
});
