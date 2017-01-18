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

form.onsubmit = function() {
  email.disabled = true;
  submit.disabled = true;

  var req = new XMLHttpRequest();;

  req.onreadystatechange = function() {
    if (req.readyState !== XMLHttpRequest.DONE)
      return;

    if (req.status !== 200)
      emoji.textContent = 'Unknown error, please retry later';
    else
      emoji.textContent = 'Subscribed, thank you!';
  };

  req.open('POST', '/api/subscribe', true);
  req.setRequestHeader('Content-Type', 'application/json');
  req.send(JSON.stringify({ email: email.value }));
};
