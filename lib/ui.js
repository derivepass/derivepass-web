var sha256 = require('hash.js').sha256;
var sha512 = require('hash.js').sha512;
var BN = require('bn.js');

var emoji = document.getElementById('emoji');
var email = document.getElementById('email');
var form = document.getElementById('subscribe');
var submit = document.getElementById('submit');

var smile = [
  "😀",    "😃",      "😄",    "😆", "😅",    "😂",    "☺️", "😊",
  "😇",    "🙂",   "🙃", "😉", "😌",    "😍",    "😘",      "😗",
  "😙",    "😚",      "😋",    "😜", "😝",    "😛",    "🤑",   "🤗",
  "🤓", "😎",      "😏",    "😒", "😞",    "😔",    "😟",      "😬",
  "🙁", "☹️", "😣",    "😖", "😫",    "😩",    "😤",      "😕",
  "😡",    "😶",      "😐",    "😑", "😯",    "😦",    "😧",      "😮",
  "😲",    "😵",      "😳",    "😨", "😰",    "😢",    "😥",      "😁",
  "😭",    "😓",      "😪",    "😴", "🙄", "🤔", "😠",      "🤐",
  "😷",    "🤒",   "🤕", "😈", "👿",    "👻",    "💀",      "☠️",
  "👽",    "👾",      "🤖", "🎃", "😺",    "😸",    "😹",      "😻",
  "😼",    "😽",      "😿",    "😾"];
var gesture = [
  "👐", "👌",      "👏", "🙏",    "👍", "👎", "👊",
  "✊", "✌️", "🙌", "🤘", "👈", "👉", "👆",
  "👇", "☝️", "✋", "🖖", "👋", "💪"];
var animal = [
  "🐶",    "🐱",    "🐭",    "🐹", "🐰",    "🐻",    "🐼",   "🐨", "🐯", "🦁",
  "🦃", "🐷",    "🐮",    "🐵", "🐒",    "🐔",    "🐧",   "🐦", "🐤", "🐣",
  "🐥",    "🐺",    "🐗",    "🐴", "🦄", "🐝",    "🐛",   "🐌", "🐚", "🐞",
  "🐜",    "🕷", "🐢",    "🐍", "🦂", "🦀", "🐙",   "🐠", "🐟", "🐡",
  "🐬",    "🐳",    "🐋",    "🐊", "🐆",    "🐅",    "🐃",   "🐂", "🐄", "🐪",
  "🐫",    "🐘",    "🐎",    "🐖", "🐐",    "🐏",    "🐑",   "🐕", "🐩", "🐈",
  "🐓",    "🐽",    "🕊", "🐇", "🐁",    "🐀",    "🐿"];
var food = [
  "🍏", "🍎", "🍐",      "🍊", "🍋", "🍌",    "🍉", "🍇", "🍓",    "🍈",    "🍒",
  "🍑", "🍍", "🍅",      "🍆", "🌽", "🌶", "🍠", "🌰", "🍯",    "🍞",    "🧀",
  "🍳", "🍤", "🍗",      "🍖", "🍕", "🌭", "🍔", "🍟", "🌮", "🌯", "🍝",
  "🍜", "🍲", "🍥",      "🍣", "🍱", "🍛",    "🍚", "🍙", "🍘",    "🍢",    "🍡",
  "🍧", "🍨", "🍦",      "🍺", "🎂", "🍮",    "🍭", "🍬", "🍫",    "🍿", "🍩",
  "🍪", "🍰", "☕️", "🍵", "🍶", "🍼",    "🍻", "🍷", "🍸",    "🍹",    "🍾"];
var object = [
  "⌚️", "📱",      "💻",       "⌨️", "🖥",   "🖨", "🖱",
  "🖲",   "🕹",   "🗜",    "💾",      "💿",      "📼",    "📷",
  "🗑",   "🎞",   "📞",       "☎️", "📟",      "📠",    "📺",
  "📻",      "🎙",   "⏱",       "⌛️", "📡",      "🔋",    "🔌",
  "💡",      "🔦",      "🕯",    "💷",      "🛢",   "💵",    "💴",
  "🎥",      "💶",      "💳",       "💎",      "⚖️", "🔧",    "🔨",
  "🔩",      "⚙️", "🔫",       "💣",      "🔪",      "🗡", "🚬",
  "🔮",      "📿",   "💈",       "⚗️", "🔭",      "🔬",    "🕳",
  "💊",      "💉",      "🌡",    "🚽",      "🚰",      "🛁",    "🛎",
  "🗝",   "🚪",      "🛋",    "🛏",   "🖼",   "🛍", "🎁",
  "🎈",      "🎀",      "🎉",       "✉️", "📦",      "🏷", "📫",
  "📯",      "📜",      "📆",       "📅",      "📇",      "🗃", "🗄",
  "📋",      "📂",      "🗞",    "📓",      "📖",      "🔗",    "📎",
  "📐",      "📌",      "🏳️", "🌈",      "✂️", "🖌", "✏️",
  "🔍",      "🔒",      "🍴"];
var alphabet = [ smile, gesture, animal, food, object ];

function onChange() {
  if (email.value === '') {
    emoji.textContent = '😬';
    return;
  }

  var text = 'derivepass/' + email.value;
  var digest = sha512().update(text).digest();

  var fingerprint = new BN(digest.slice(0, 8), 'le');

  var out = '';
  for (var i = 0; i < alphabet.length; i++) {
    var idx = fingerprint.modn(alphabet[i].length);
    fingerprint.idivn(alphabet[i].length);

    out += alphabet[i][idx];
  }

  emoji.textContent = out;
}

email.onkeyup = onChange;
email.onkeypress = onChange;

function pow(complexity) {
  var nonce = new Array(32);

  for (var i = 0; i < nonce.length; i++)
    nonce[i] = (Math.random() * 0x100) | 0;

  function genNonce(nonce) {
    var carry = 1;
    for (var i = 0; i < nonce.length; i++) {
      var v = nonce[i] + carry;
      nonce[i] = v & 0xff;
      carry = v >>> 8;
    }
  };

  function checkComplexity(hash, complexity) {
    var off = 0;
    var i;
    for (i = 0; i <= complexity - 8; i += 8, off++) {
      if (hash[off] !== 0)
        return false;
    }

    var mask = 0xff << (8 + i - complexity);
    return (hash[off] & mask) === 0;
  };

  var hash;
  do {
    genNonce(nonce);

    hash = sha256().update(nonce).digest();
  } while (!checkComplexity(hash, complexity));

  return btoa(nonce.map(function(elem) {
    return String.fromCharCode(elem);
  }).join(''));
}

form.onsubmit = function(e) {
  e.preventDefault();

  email.disabled = true;
  submit.disabled = true;

  var req = new XMLHttpRequest();

  req.onreadystatechange = function() {
    if (req.readyState !== XMLHttpRequest.DONE)
      return;

    if (req.status !== 200)
      emoji.textContent = 'Unknown error, please retry later';
    else
      emoji.textContent = 'Subscribed, thank you!';
  };

  const nonce = pow(18);

  req.open('POST', '/api/subscribe', true);
  req.setRequestHeader('Content-Type', 'application/json');
  req.setRequestHeader('X-Proof-Of-Work', nonce);
  req.send(JSON.stringify({ email: email.value }));
};
