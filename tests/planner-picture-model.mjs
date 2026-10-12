import assert from 'node:assert/strict';
import * as model from '../public/model.mjs';
const mode=process.argv[2];
assert(['area','transform','motifs'].includes(mode));
const idx=(r,c)=>12*r+(r%2?11-c:c);
const freeze=s=>Object.freeze({...s,colors:Object.freeze([...s.colors])});
function fresh(a,b){assert.notEqual(a,b);assert.notEqual(a.colors,b.colors);assert.equal(b.remaining,a.remaining)}
if(mode==='area'){
 assert.equal(typeof model.paintArea,'function');
 for(const area of ['stitch','patch','row','column']){
  const s=freeze({pattern:'custom',remaining:192,colors:Array.from({length:192},(_,i)=>{let r=Math.floor(i/12),c=r%2?11-i%12:i%12;return r>=3&&r<=5&&c>=2&&c<=4?1:0})});
  const before=[...s.colors];let expected=[...before];
  for(let r=0;r<16;r++)for(let c=0;c<12;c++)if(area==='stitch'?r===4&&c===3:area==='row'?r===4:area==='column'?c===3:r>=3&&r<=5&&c>=2&&c<=4)expected[idx(r,c)]=2;
  const next=model.paintArea(s,idx(4,3),2,area);fresh(s,next);assert.deepEqual(next.colors,expected);assert.equal(next.pattern,'custom');assert.deepEqual(s.colors,before);
  const noChange=model.paintArea(next,idx(4,3),2,area);fresh(next,noChange);assert.deepEqual(noChange,next);
 }
 // Diagonal-only equal color is not connected, and odd row order is physical, not numerical.
 const cs=Array(192).fill(0);for(const [r,c]of [[1,1],[2,2],[3,3]])cs[idx(r,c)]=1;
 const s=freeze({pattern:'custom',remaining:192,colors:cs});let e=[...cs];e[idx(2,2)]=3;assert.deepEqual(model.paintArea(s,idx(2,2),3,'patch').colors,e);
 for(const [index,color,area]of [[-1,2,'patch'],[192,2,'row'],[1.5,2,'column'],[0,4,'row'],[0,1,'unknown']]){let n=model.paintArea(s,index,color,area);fresh(s,n);assert.deepEqual(n,s)}
 const locked=freeze({...s,remaining:191});assert.deepEqual(model.paintArea(locked,0,1,'row'),locked);
 const moth=freeze(model.createState());assert.deepEqual(model.paintArea(moth,0,moth.colors[0],'stitch'),moth);
 console.log('dye areas follow physical rows columns and four-neighbor color patches');
}
if(mode==='transform'){
 assert.equal(typeof model.transformPicture,'function');
 const s=freeze({pattern:'custom',remaining:192,colors:Array.from({length:192},(_,i)=>(i*7+Math.floor(i/12))%4)});
 for(const kind of ['left-right','top-bottom','half-turn','colors-forward','colors-back']){
  let e=Array(192);for(let r=0;r<16;r++)for(let c=0;c<12;c++)e[idx(r,c)]=kind==='left-right'?s.colors[idx(r,11-c)]:kind==='top-bottom'?s.colors[idx(15-r,c)]:kind==='half-turn'?s.colors[idx(15-r,11-c)]:((s.colors[idx(r,c)]+(kind==='colors-forward'?1:3))%4);
  const next=model.transformPicture(s,kind);fresh(s,next);assert.deepEqual(next.colors,e);assert.equal(next.pattern,'custom');
  if(!kind.startsWith('colors-'))assert.deepEqual(model.transformPicture(next,kind).colors,s.colors);
 }
 let next=s;for(let n=0;n<4;n++)next=model.transformPicture(next,'colors-forward');assert.deepEqual(next.colors,s.colors);
 assert.deepEqual(model.transformPicture(model.transformPicture(s,'colors-forward'),'colors-back').colors,s.colors);
 assert.deepEqual(model.transformPicture({...s,remaining:180},'left-right'),{...s,remaining:180});
 assert.deepEqual(model.transformPicture(s,'unknown'),s);
 const blank=freeze({pattern:'moth',remaining:192,colors:Array(192).fill(0)});assert.deepEqual(model.transformPicture(blank,'left-right'),blank);
 console.log('picture reflections and palette cycles preserve the continuous strand order');
}
if(mode==='motifs'){
 const expectedColor=(name,r,c)=>{if(name==='blank')return 0;if(name==='lantern'){if(r>=4&&r<=11&&c>=3&&c<=8){if(c===3||c===8||r===4||r===11)return 1;return(c===5||c===6)?2:0}if((r===12||r===13)&&(c===5||c===6))return 3;return 0}if(name==='fern'){if(c===5&&r>=1&&r<=14)return 3;for(const [row,width]of [[3,4],[5,4],[7,3],[9,3],[11,2],[13,1]])if(r===row&&Math.abs(c-5)<=width)return c===5?3:1;return 0}if(name==='window'){if(r>=3&&r<=12&&c>=2&&c<=9){if(c===2||c===9||r===3||r===12)return 3;if(c===5||c===6||r===7||r===8)return 0;return 2}return 0}throw Error(name)};
 for(const name of ['blank','lantern','fern','window']){const s=model.createState({pattern:name});assert.equal(s.pattern,name);assert.equal(s.remaining,192);const e=Array(192);for(let r=0;r<16;r++)for(let c=0;c<12;c++)e[idx(r,c)]=expectedColor(name,r,c);assert.deepEqual(s.colors,e);const locked=model.pull(s,192);assert.deepEqual(model.knit(locked,192),s);assert.deepEqual(model.choosePattern(locked,name),s);const dyed=model.paint(s,191,3);assert.equal(dyed.pattern,'custom');assert.equal(dyed.colors[191],3)}
 assert.throws(()=>model.createState({pattern:'not-a-picture'}),RangeError);
 console.log('four new cloth pictures use exact physical-coordinate motifs and no new yarn');
}
