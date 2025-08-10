// Neon Password Generator UI Logic
(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const output = $('#passwordOutput');
  const copyBtn = $('#copyBtn');
  const regenBtn = $('#regenBtn');
  const lengthRange = $('#lengthRange');
  const lengthValue = $('#lengthValue');
  const uppercase = $('#uppercase');
  const numbers = $('#numbers');
  const symbols = $('#symbols');
  const strengthBar = $('.strength-bar');
  const strengthFill = $('.strength-fill');
  const strengthScoreEl = $('.strength-score');

  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const NUM = '0123456789';
  const SYM = '!@#$%^&*()_+-=[]{}|;:,.<>/?~';

  // Secure randomness helpers
  const hasCrypto = typeof window !== 'undefined' && (window.crypto || window.msCrypto);
  const cryptoObj = hasCrypto ? (window.crypto || window.msCrypto) : null;

  function randomValues(buf){
    if(cryptoObj && cryptoObj.getRandomValues){
      return cryptoObj.getRandomValues(buf);
    }
    // Fallback to Math.random (less secure)
    for(let i=0;i<buf.length;i++) buf[i] = Math.floor(Math.random()*256);
    return buf;
  }

  // Generate uniform random index < max using rejection sampling to avoid modulo bias.
  function randomIndex(max){
    if(max <= 0) return 0;
    const maxUint = 256; // using byte-wise sampling
    const limit = Math.floor(maxUint / max) * max; // highest multiple of max below 256
    while(true){
      const val = randomValues(new Uint8Array(1))[0];
      if(val < limit) return val % max;
    }
  }

  function shuffleArray(arr){
    for(let i = arr.length - 1; i > 0; i--){
      const j = randomIndex(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function generatePassword(len, opts){
    const pools = [LOWER];
    if(opts.uppercase) pools.push(UPPER);
    if(opts.numbers) pools.push(NUM);
    if(opts.symbols) pools.push(SYM);

    const full = pools.join('');
    if(full.length === 0) return '';

    // Ensure at least one char from each selected pool
    const chars = [];
    for(const pool of pools){
      const idx = randomIndex(pool.length);
      chars.push(pool[idx]);
    }

    // Fill remaining with full pool
    for(let i = chars.length; i < len; i++){
      const idx = randomIndex(full.length);
      chars.push(full[idx]);
    }

    shuffleArray(chars);
    return chars.join('');
  }

  function estimateStrength(pwd, opts){
    if(!pwd) return {score:0, entropy:0};
    // Estimate pool size based on enabled sets actually present
    let pool = LOWER.length;
    let presentSets = 1;
    if(opts.uppercase){ pool += UPPER.length; }
    if(opts.numbers){ pool += NUM.length; }
    if(opts.symbols){ pool += SYM.length; }

    const length = pwd.length;
    const entropy = length * Math.log2(pool); // bits

    // Heuristic boosts/penalties
    let bonus = 0;
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNum = /\d/.test(pwd);
    const hasSym = /[^\da-zA-Z]/.test(pwd);
    const variety = [hasLower, hasUpper, hasNum, hasSym].filter(Boolean).length;
    bonus += (variety - 1) * 5; // +5 per extra class used

    if(length >= 12) bonus += 10;
    if(length >= 16) bonus += 10;
    if(length >= 24) bonus += 10;

    // Penalties for repeats and sequences
    if(/(.)\1{2,}/.test(pwd)) bonus -= 10; // 3+ repeated chars
    if(/(0123|1234|2345|3456|4567|5678|6789)/.test(pwd)) bonus -= 8;
    if(/(abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz)/i.test(pwd)) bonus -= 8;

    // Map to 0-100 scale
    const maxBits = 120; // cap for bar
    let score = Math.max(0, Math.min(100, (entropy / maxBits) * 100 + bonus));
    score = Math.round(score);
    return {score, entropy: Math.round(entropy)};
  }

  function updateStrengthUI(score){
    const width = Math.max(6, score) + '%'; // keep a small visible fill
    const hue = Math.round((score/100) * 120); // 0 red -> 120 green
    strengthFill.style.width = width;
    document.documentElement.style.setProperty('--strength', width);
    document.documentElement.style.setProperty('--strength-hue', String(hue));
    strengthScoreEl.textContent = score + '%';
  }

  function syncLength(){
    lengthValue.textContent = lengthRange.value;
  }

  function regenerate(){
    const len = parseInt(lengthRange.value, 10);
    const opts = { uppercase: uppercase.checked, numbers: numbers.checked, symbols: symbols.checked };
    const pwd = generatePassword(len, opts);
    output.value = pwd;
    const {score} = estimateStrength(pwd, opts);
    updateStrengthUI(score);
  }

  // Events
  regenBtn.addEventListener('click', regenerate);
  [lengthRange, uppercase, numbers, symbols].forEach(el => {
    el.addEventListener('input', () => { syncLength(); regenerate(); });
    el.addEventListener('change', () => { syncLength(); regenerate(); });
  });

  copyBtn.addEventListener('click', async () => {
    const txt = output.value || '';
    if(!txt) return;
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(txt);
      }else{
        // Fallback
        output.select(); document.execCommand('copy'); output.blur();
      }
      copyBtn.classList.add('copied');
      setTimeout(()=> copyBtn.classList.remove('copied'), 1200);
    }catch(e){
      console.error('Copy failed', e);
    }
  });

  // Initialize
  syncLength();
  regenerate();
})();
