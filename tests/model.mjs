import assert from 'node:assert/strict';
import {createState,pull,knit,paint,choosePattern} from '../public/model.mjs';
const index=(r,c)=>r*12+(r%2?11-c:c);
function expected(name,r,c){
 if(name==='moth'){
  const widths=[1,2,4,5,5,4,3,4,3,1];
  let v=0,w=widths[r-3];
  if(w!==undefined&&c>=6-w&&c<=5+w)v=1;
  if(r>=2&&r<=13&&(c===5||c===6))v=3;
  if([[7,2],[7,9],[9,3],[9,8]].some(([a,b])=>a===r&&b===c))v=2;
  return v;
 }
 if(name==='stairs')return c===Math.floor(r/2)?2:c<Math.floor(r/2)?3:0;
 return (r-10)**2+(c-7)**2<=9?2:r>=1&&r<=9&&Math.abs(c-r+2)<=1?1:0;
}
for(const name of ['moth','stairs','comet']){
 let s=createState({pattern:name});
 assert.equal(s.remaining,192);assert.equal(s.pattern,name);assert.equal(s.colors.length,192);
 for(let r=0;r<16;r++)for(let c=0;c<12;c++)assert.equal(s.colors[index(r,c)],expected(name,r,c),`${name} ${r},${c}`);
 const original=structuredClone(s);
 for(let i=191;i>=0;i--){s=pull(s,1);assert.equal(s.remaining,i);assert.deepEqual(s.colors,original.colors);}
 assert.equal(pull(s,1).remaining,0);
 for(let i=1;i<=192;i++){s=knit(s,1);assert.equal(s.remaining,i);assert.deepEqual(s.colors,original.colors);}
 assert.deepEqual(s,original);
}
let s=createState();const snapshot=structuredClone(s);
Object.freeze(s.colors);Object.freeze(s);
for(const count of [-1,NaN,Infinity,-Infinity])assert.deepEqual(pull(s,count),snapshot);
assert.equal(pull(s,12.9).remaining,180);assert.equal(pull(s,999).remaining,0);
assert.equal(knit(pull(s,999),999).remaining,192);
assert.equal(knit(pull(s,12),3.9).remaining,183);
assert.deepEqual(s,snapshot);
let edited=paint(s,191,2);assert.equal(edited.colors[191],2);assert.equal(edited.pattern,'custom');assert.notEqual(edited.colors,s.colors);
assert.deepEqual(paint(s,0,s.colors[0]),s);
for(const [i,c] of [[-1,0],[192,0],[1.5,0],[0,-1],[0,4],[0,1.5]])assert.deepEqual(paint(s,i,c),s);
let half=pull(edited,96);assert.deepEqual(paint(half,0,2),half);
assert.deepEqual(knit(pull(edited,192),192).colors,edited.colors);
assert.deepEqual(choosePattern(half,'comet'),createState({pattern:'comet'}));
assert.throws(()=>choosePattern(s,'bogus'),RangeError);
assert.throws(()=>createState({pattern:'bogus'}),RangeError);
console.log('thread model pass');
