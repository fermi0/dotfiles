var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/unique-names-generator/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/unique-names-generator/dist/index.js"(exports) {
    var a = (a2) => {
      a2 = 1831565813 + (a2 |= 0) | 0;
      let e2 = Math.imul(a2 ^ a2 >>> 15, 1 | a2);
      return e2 = e2 + Math.imul(e2 ^ e2 >>> 7, 61 | e2) ^ e2, ((e2 ^ e2 >>> 14) >>> 0) / 4294967296;
    };
    var e = class {
      constructor(a2) {
        this.dictionaries = void 0, this.length = void 0, this.separator = void 0, this.style = void 0, this.seed = void 0;
        const { length: e2, separator: i2, dictionaries: n, style: l, seed: r } = a2;
        this.dictionaries = n, this.separator = i2, this.length = e2, this.style = l, this.seed = r;
      }
      generate() {
        if (!this.dictionaries) throw new Error('Cannot find any dictionary. Please provide at least one, or leave the "dictionary" field empty in the config object');
        if (this.length <= 0) throw new Error("Invalid length provided");
        if (this.length > this.dictionaries.length) throw new Error(`The length cannot be bigger than the number of dictionaries.
Length provided: ${this.length}. Number of dictionaries provided: ${this.dictionaries.length}`);
        let e2 = this.seed;
        return this.dictionaries.slice(0, this.length).reduce((i2, n) => {
          let l;
          e2 ? (l = ((e3) => {
            if ("string" == typeof e3) {
              const i3 = e3.split("").map((a2) => a2.charCodeAt(0)).reduce((a2, e4) => a2 + e4, 1), n2 = Math.floor(Number(i3));
              return a(n2);
            }
            return a(e3);
          })(e2), e2 = 4294967296 * l) : l = Math.random();
          let r = n[Math.floor(l * n.length)] || "";
          if ("lowerCase" === this.style) r = r.toLowerCase();
          else if ("capital" === this.style) {
            const [a2, ...e3] = r.split("");
            r = a2.toUpperCase() + e3.join("");
          } else "upperCase" === this.style && (r = r.toUpperCase());
          return i2 ? `${i2}${this.separator}${r}` : `${r}`;
        }, "");
      }
    };
    var i = { separator: "_", dictionaries: [] };
    exports.NumberDictionary = class {
      static generate(a2 = {}) {
        let e2 = a2.min || 1, i2 = a2.max || 999;
        if (a2.length) {
          const n = Math.pow(10, a2.length);
          return e2 = n / 10, i2 = n - 1, [`${Math.floor(Math.random() * (i2 - e2)) + e2}`];
        }
        return [`${Math.floor(Math.random() * (i2 - e2)) + e2}`];
      }
    }, exports.adjectives = ["able", "above", "absent", "absolute", "abstract", "abundant", "academic", "acceptable", "accepted", "accessible", "accurate", "accused", "active", "actual", "acute", "added", "additional", "adequate", "adjacent", "administrative", "adorable", "advanced", "adverse", "advisory", "aesthetic", "afraid", "aggregate", "aggressive", "agreeable", "agreed", "agricultural", "alert", "alive", "alleged", "allied", "alone", "alright", "alternative", "amateur", "amazing", "ambitious", "amused", "ancient", "angry", "annoyed", "annual", "anonymous", "anxious", "appalling", "apparent", "applicable", "appropriate", "arbitrary", "architectural", "armed", "arrogant", "artificial", "artistic", "ashamed", "asleep", "assistant", "associated", "atomic", "attractive", "automatic", "autonomous", "available", "average", "awake", "aware", "awful", "awkward", "back", "bad", "balanced", "bare", "basic", "beautiful", "beneficial", "better", "bewildered", "big", "binding", "biological", "bitter", "bizarre", "blank", "blind", "blonde", "bloody", "blushing", "boiling", "bold", "bored", "boring", "bottom", "brainy", "brave", "breakable", "breezy", "brief", "bright", "brilliant", "broad", "broken", "bumpy", "burning", "busy", "calm", "capable", "capitalist", "careful", "casual", "causal", "cautious", "central", "certain", "changing", "characteristic", "charming", "cheap", "cheerful", "chemical", "chief", "chilly", "chosen", "christian", "chronic", "chubby", "circular", "civic", "civil", "civilian", "classic", "classical", "clean", "clear", "clever", "clinical", "close", "closed", "cloudy", "clumsy", "coastal", "cognitive", "coherent", "cold", "collective", "colonial", "colorful", "colossal", "coloured", "colourful", "combative", "combined", "comfortable", "coming", "commercial", "common", "communist", "compact", "comparable", "comparative", "compatible", "competent", "competitive", "complete", "complex", "complicated", "comprehensive", "compulsory", "conceptual", "concerned", "concrete", "condemned", "confident", "confidential", "confused", "conscious", "conservation", "conservative", "considerable", "consistent", "constant", "constitutional", "contemporary", "content", "continental", "continued", "continuing", "continuous", "controlled", "controversial", "convenient", "conventional", "convinced", "convincing", "cooing", "cool", "cooperative", "corporate", "correct", "corresponding", "costly", "courageous", "crazy", "creative", "creepy", "criminal", "critical", "crooked", "crowded", "crucial", "crude", "cruel", "cuddly", "cultural", "curious", "curly", "current", "curved", "cute", "daily", "damaged", "damp", "dangerous", "dark", "dead", "deaf", "deafening", "dear", "decent", "decisive", "deep", "defeated", "defensive", "defiant", "definite", "deliberate", "delicate", "delicious", "delighted", "delightful", "democratic", "dependent", "depressed", "desirable", "desperate", "detailed", "determined", "developed", "developing", "devoted", "different", "difficult", "digital", "diplomatic", "direct", "dirty", "disabled", "disappointed", "disastrous", "disciplinary", "disgusted", "distant", "distinct", "distinctive", "distinguished", "disturbed", "disturbing", "diverse", "divine", "dizzy", "domestic", "dominant", "double", "doubtful", "drab", "dramatic", "dreadful", "driving", "drunk", "dry", "dual", "due", "dull", "dusty", "dutch", "dying", "dynamic", "eager", "early", "eastern", "easy", "economic", "educational", "eerie", "effective", "efficient", "elaborate", "elated", "elderly", "eldest", "electoral", "electric", "electrical", "electronic", "elegant", "eligible", "embarrassed", "embarrassing", "emotional", "empirical", "empty", "enchanting", "encouraging", "endless", "energetic", "enormous", "enthusiastic", "entire", "entitled", "envious", "environmental", "equal", "equivalent", "essential", "established", "estimated", "ethical", "ethnic", "eventual", "everyday", "evident", "evil", "evolutionary", "exact", "excellent", "exceptional", "excess", "excessive", "excited", "exciting", "exclusive", "existing", "exotic", "expected", "expensive", "experienced", "experimental", "explicit", "extended", "extensive", "external", "extra", "extraordinary", "extreme", "exuberant", "faint", "fair", "faithful", "familiar", "famous", "fancy", "fantastic", "far", "fascinating", "fashionable", "fast", "fat", "fatal", "favourable", "favourite", "federal", "fellow", "female", "feminist", "few", "fierce", "filthy", "final", "financial", "fine", "firm", "fiscal", "fit", "fixed", "flaky", "flat", "flexible", "fluffy", "fluttering", "flying", "following", "fond", "foolish", "foreign", "formal", "formidable", "forthcoming", "fortunate", "forward", "fragile", "frail", "frantic", "free", "frequent", "fresh", "friendly", "frightened", "front", "frozen", "full", "fun", "functional", "fundamental", "funny", "furious", "future", "fuzzy", "gastric", "gay", "general", "generous", "genetic", "gentle", "genuine", "geographical", "giant", "gigantic", "given", "glad", "glamorous", "gleaming", "global", "glorious", "golden", "good", "gorgeous", "gothic", "governing", "graceful", "gradual", "grand", "grateful", "greasy", "great", "grieving", "grim", "gross", "grotesque", "growing", "grubby", "grumpy", "guilty", "handicapped", "handsome", "happy", "hard", "harsh", "head", "healthy", "heavy", "helpful", "helpless", "hidden", "high", "hilarious", "hissing", "historic", "historical", "hollow", "holy", "homeless", "homely", "hon", "honest", "horizontal", "horrible", "hostile", "hot", "huge", "human", "hungry", "hurt", "hushed", "husky", "icy", "ideal", "identical", "ideological", "ill", "illegal", "imaginative", "immediate", "immense", "imperial", "implicit", "important", "impossible", "impressed", "impressive", "improved", "inadequate", "inappropriate", "inc", "inclined", "increased", "increasing", "incredible", "independent", "indirect", "individual", "industrial", "inevitable", "influential", "informal", "inherent", "initial", "injured", "inland", "inner", "innocent", "innovative", "inquisitive", "instant", "institutional", "insufficient", "intact", "integral", "integrated", "intellectual", "intelligent", "intense", "intensive", "interested", "interesting", "interim", "interior", "intermediate", "internal", "international", "intimate", "invisible", "involved", "irrelevant", "isolated", "itchy", "jealous", "jittery", "joint", "jolly", "joyous", "judicial", "juicy", "junior", "just", "keen", "key", "kind", "known", "labour", "large", "late", "latin", "lazy", "leading", "left", "legal", "legislative", "legitimate", "lengthy", "lesser", "level", "lexical", "liable", "liberal", "light", "like", "likely", "limited", "linear", "linguistic", "liquid", "literary", "little", "live", "lively", "living", "local", "logical", "lonely", "long", "loose", "lost", "loud", "lovely", "low", "loyal", "ltd", "lucky", "mad", "magic", "magnetic", "magnificent", "main", "major", "male", "mammoth", "managerial", "managing", "manual", "many", "marginal", "marine", "marked", "married", "marvellous", "marxist", "mass", "massive", "mathematical", "mature", "maximum", "mean", "meaningful", "mechanical", "medical", "medieval", "melodic", "melted", "mental", "mere", "metropolitan", "mid", "middle", "mighty", "mild", "military", "miniature", "minimal", "minimum", "ministerial", "minor", "miserable", "misleading", "missing", "misty", "mixed", "moaning", "mobile", "moderate", "modern", "modest", "molecular", "monetary", "monthly", "moral", "motionless", "muddy", "multiple", "mushy", "musical", "mute", "mutual", "mysterious", "naked", "narrow", "nasty", "national", "native", "natural", "naughty", "naval", "near", "nearby", "neat", "necessary", "negative", "neighbouring", "nervous", "net", "neutral", "new", "nice", "noble", "noisy", "normal", "northern", "nosy", "notable", "novel", "nuclear", "numerous", "nursing", "nutritious", "nutty", "obedient", "objective", "obliged", "obnoxious", "obvious", "occasional", "occupational", "odd", "official", "ok", "okay", "old", "olympic", "only", "open", "operational", "opposite", "optimistic", "oral", "ordinary", "organic", "organisational", "original", "orthodox", "other", "outdoor", "outer", "outrageous", "outside", "outstanding", "overall", "overseas", "overwhelming", "painful", "pale", "panicky", "parallel", "parental", "parliamentary", "partial", "particular", "passing", "passive", "past", "patient", "payable", "peaceful", "peculiar", "perfect", "permanent", "persistent", "personal", "petite", "philosophical", "physical", "plain", "planned", "plastic", "pleasant", "pleased", "poised", "polite", "political", "poor", "popular", "positive", "possible", "potential", "powerful", "practical", "precious", "precise", "preferred", "pregnant", "preliminary", "premier", "prepared", "present", "presidential", "pretty", "previous", "prickly", "primary", "prime", "primitive", "principal", "printed", "prior", "private", "probable", "productive", "professional", "profitable", "profound", "progressive", "prominent", "promising", "proper", "proposed", "prospective", "protective", "protestant", "proud", "provincial", "psychiatric", "psychological", "public", "puny", "pure", "purring", "puzzled", "quaint", "qualified", "quarrelsome", "querulous", "quick", "quickest", "quiet", "quintessential", "quixotic", "racial", "radical", "rainy", "random", "rapid", "rare", "raspy", "rational", "ratty", "raw", "ready", "real", "realistic", "rear", "reasonable", "recent", "reduced", "redundant", "regional", "registered", "regular", "regulatory", "related", "relative", "relaxed", "relevant", "reliable", "relieved", "religious", "reluctant", "remaining", "remarkable", "remote", "renewed", "representative", "repulsive", "required", "resident", "residential", "resonant", "respectable", "respective", "responsible", "resulting", "retail", "retired", "revolutionary", "rich", "ridiculous", "right", "rigid", "ripe", "rising", "rival", "roasted", "robust", "rolling", "romantic", "rotten", "rough", "round", "royal", "rubber", "rude", "ruling", "running", "rural", "sacred", "sad", "safe", "salty", "satisfactory", "satisfied", "scared", "scary", "scattered", "scientific", "scornful", "scrawny", "screeching", "secondary", "secret", "secure", "select", "selected", "selective", "selfish", "semantic", "senior", "sensible", "sensitive", "separate", "serious", "severe", "sexual", "shaggy", "shaky", "shallow", "shared", "sharp", "sheer", "shiny", "shivering", "shocked", "short", "shrill", "shy", "sick", "significant", "silent", "silky", "silly", "similar", "simple", "single", "skilled", "skinny", "sleepy", "slight", "slim", "slimy", "slippery", "slow", "small", "smart", "smiling", "smoggy", "smooth", "social", "socialist", "soft", "solar", "sole", "solid", "sophisticated", "sore", "sorry", "sound", "sour", "southern", "soviet", "spare", "sparkling", "spatial", "special", "specific", "specified", "spectacular", "spicy", "spiritual", "splendid", "spontaneous", "sporting", "spotless", "spotty", "square", "squealing", "stable", "stale", "standard", "static", "statistical", "statutory", "steady", "steep", "sticky", "stiff", "still", "stingy", "stormy", "straight", "straightforward", "strange", "strategic", "strict", "striking", "striped", "strong", "structural", "stuck", "stupid", "subjective", "subsequent", "substantial", "subtle", "successful", "successive", "sudden", "sufficient", "suitable", "sunny", "super", "superb", "superior", "supporting", "supposed", "supreme", "sure", "surprised", "surprising", "surrounding", "surviving", "suspicious", "sweet", "swift", "symbolic", "sympathetic", "systematic", "tall", "tame", "tart", "tasteless", "tasty", "technical", "technological", "teenage", "temporary", "tender", "tense", "terrible", "territorial", "testy", "then", "theoretical", "thick", "thin", "thirsty", "thorough", "thoughtful", "thoughtless", "thundering", "tight", "tiny", "tired", "top", "tory", "total", "tough", "toxic", "traditional", "tragic", "tremendous", "tricky", "tropical", "troubled", "typical", "ugliest", "ugly", "ultimate", "unable", "unacceptable", "unaware", "uncertain", "unchanged", "uncomfortable", "unconscious", "underground", "underlying", "unemployed", "uneven", "unexpected", "unfair", "unfortunate", "unhappy", "uniform", "uninterested", "unique", "united", "universal", "unknown", "unlikely", "unnecessary", "unpleasant", "unsightly", "unusual", "unwilling", "upper", "upset", "uptight", "urban", "urgent", "used", "useful", "useless", "usual", "vague", "valid", "valuable", "variable", "varied", "various", "varying", "vast", "verbal", "vertical", "very", "vicarious", "vicious", "victorious", "violent", "visible", "visiting", "visual", "vital", "vitreous", "vivacious", "vivid", "vocal", "vocational", "voiceless", "voluminous", "voluntary", "vulnerable", "wandering", "warm", "wasteful", "watery", "weak", "wealthy", "weary", "wee", "weekly", "weird", "welcome", "well", "western", "wet", "whispering", "whole", "wicked", "wide", "widespread", "wild", "wilful", "willing", "willowy", "wily", "wise", "wispy", "wittering", "witty", "wonderful", "wooden", "working", "worldwide", "worried", "worrying", "worthwhile", "worthy", "written", "wrong", "xenacious", "xenial", "xenogeneic", "xenophobic", "xeric", "xerothermic", "yabbering", "yammering", "yappiest", "yappy", "yawning", "yearling", "yearning", "yeasty", "yelling", "yelping", "yielding", "yodelling", "young", "youngest", "youthful", "ytterbic", "yucky", "yummy", "zany", "zealous", "zeroth", "zestful", "zesty", "zippy", "zonal", "zoophagous", "zygomorphic", "zygotic"], exports.animals = ["aardvark", "aardwolf", "albatross", "alligator", "alpaca", "amphibian", "anaconda", "angelfish", "anglerfish", "ant", "anteater", "antelope", "antlion", "ape", "aphid", "armadillo", "asp", "baboon", "badger", "bandicoot", "barnacle", "barracuda", "basilisk", "bass", "bat", "bear", "beaver", "bedbug", "bee", "beetle", "bird", "bison", "blackbird", "boa", "boar", "bobcat", "bobolink", "bonobo", "booby", "bovid", "bug", "butterfly", "buzzard", "camel", "canid", "canidae", "capybara", "cardinal", "caribou", "carp", "cat", "caterpillar", "catfish", "catshark", "cattle", "centipede", "cephalopod", "chameleon", "cheetah", "chickadee", "chicken", "chimpanzee", "chinchilla", "chipmunk", "cicada", "clam", "clownfish", "cobra", "cockroach", "cod", "condor", "constrictor", "coral", "cougar", "cow", "coyote", "crab", "crane", "crawdad", "crayfish", "cricket", "crocodile", "crow", "cuckoo", "damselfly", "deer", "dingo", "dinosaur", "dog", "dolphin", "donkey", "dormouse", "dove", "dragon", "dragonfly", "duck", "eagle", "earthworm", "earwig", "echidna", "eel", "egret", "elephant", "elk", "emu", "ermine", "falcon", "felidae", "ferret", "finch", "firefly", "fish", "flamingo", "flea", "fly", "flyingfish", "fowl", "fox", "frog", "galliform", "gamefowl", "gayal", "gazelle", "gecko", "gerbil", "gibbon", "giraffe", "goat", "goldfish", "goose", "gopher", "gorilla", "grasshopper", "grouse", "guan", "guanaco", "guineafowl", "gull", "guppy", "haddock", "halibut", "hamster", "hare", "harrier", "hawk", "hedgehog", "heron", "herring", "hippopotamus", "hookworm", "hornet", "horse", "hoverfly", "hummingbird", "hyena", "iguana", "impala", "jackal", "jaguar", "jay", "jellyfish", "junglefowl", "kangaroo", "kingfisher", "kite", "kiwi", "koala", "koi", "krill", "ladybug", "lamprey", "landfowl", "lark", "leech", "lemming", "lemur", "leopard", "leopon", "limpet", "lion", "lizard", "llama", "lobster", "locust", "loon", "louse", "lungfish", "lynx", "macaw", "mackerel", "magpie", "mammal", "manatee", "mandrill", "marlin", "marmoset", "marmot", "marsupial", "marten", "mastodon", "meadowlark", "meerkat", "mink", "minnow", "mite", "mockingbird", "mole", "mollusk", "mongoose", "monkey", "moose", "mosquito", "moth", "mouse", "mule", "muskox", "narwhal", "newt", "nightingale", "ocelot", "octopus", "opossum", "orangutan", "orca", "ostrich", "otter", "owl", "ox", "panda", "panther", "parakeet", "parrot", "parrotfish", "partridge", "peacock", "peafowl", "pelican", "penguin", "perch", "pheasant", "pig", "pigeon", "pike", "pinniped", "piranha", "planarian", "platypus", "pony", "porcupine", "porpoise", "possum", "prawn", "primate", "ptarmigan", "puffin", "puma", "python", "quail", "quelea", "quokka", "rabbit", "raccoon", "rat", "rattlesnake", "raven", "reindeer", "reptile", "rhinoceros", "roadrunner", "rodent", "rook", "rooster", "roundworm", "sailfish", "salamander", "salmon", "sawfish", "scallop", "scorpion", "seahorse", "shark", "sheep", "shrew", "shrimp", "silkworm", "silverfish", "skink", "skunk", "sloth", "slug", "smelt", "snail", "snake", "snipe", "sole", "sparrow", "spider", "spoonbill", "squid", "squirrel", "starfish", "stingray", "stoat", "stork", "sturgeon", "swallow", "swan", "swift", "swordfish", "swordtail", "tahr", "takin", "tapir", "tarantula", "tarsier", "termite", "tern", "thrush", "tick", "tiger", "tiglon", "toad", "tortoise", "toucan", "trout", "tuna", "turkey", "turtle", "tyrannosaurus", "unicorn", "urial", "vicuna", "viper", "vole", "vulture", "wallaby", "walrus", "warbler", "wasp", "weasel", "whale", "whippet", "whitefish", "wildcat", "wildebeest", "wildfowl", "wolf", "wolverine", "wombat", "woodpecker", "worm", "wren", "xerinae", "yak", "zebra"], exports.colors = ["amaranth", "amber", "amethyst", "apricot", "aqua", "aquamarine", "azure", "beige", "black", "blue", "blush", "bronze", "brown", "chocolate", "coffee", "copper", "coral", "crimson", "cyan", "emerald", "fuchsia", "gold", "gray", "green", "harlequin", "indigo", "ivory", "jade", "lavender", "lime", "magenta", "maroon", "moccasin", "olive", "orange", "peach", "pink", "plum", "purple", "red", "rose", "salmon", "sapphire", "scarlet", "silver", "tan", "teal", "tomato", "turquoise", "violet", "white", "yellow"], exports.countries = ["Afghanistan", "\xC5land Islands", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua & Barbuda", "Argentina", "Armenia", "Aruba", "Ascension Island", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia & Herzegovina", "Botswana", "Brazil", "British Indian Ocean Territory", "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Canary Islands", "Cape Verde", "Caribbean Netherlands", "Cayman Islands", "Central African Republic", "Ceuta & Melilla", "Chad", "Chile", "China", "Christmas Island", "Cocos Islands", "Colombia", "Comoros", "Congo", "Cook Islands", "Costa Rica", "C\xF4te d'Ivoire", "Croatia", "Cuba", "Cura\xE7ao", "Cyprus", "Czechia", "Denmark", "Diego Garcia", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Eurozone", "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana", "French Polynesia", "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong SAR China", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau SAR China", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "Norfolk Island", "North Korea", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau", "Palestinian Territories", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Pitcairn Islands", "Poland", "Portugal", "Puerto Rico", "Qatar", "R\xE9union", "Romania", "Russia", "Rwanda", "Samoa", "San Marino", "S\xE3o Tom\xE9 & Pr\xEDncipe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Sint Maarten", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Georgia & South Sandwich Islands", "South Korea", "South Sudan", "Spain", "Sri Lanka", "St. Barth\xE9lemy", "St. Helena", "St. Kitts & Nevis", "St. Lucia", "St. Martin", "St. Pierre & Miquelon", "St. Vincent & Grenadines", "Sudan", "Suriname", "Svalbard & Jan Mayen", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tokelau", "Tonga", "Trinidad & Tobago", "Tristan da Cunha", "Tunisia", "Turkey", "Turkmenistan", "Turks & Caicos Islands", "Tuvalu", "U.S. Outlying Islands", "U.S. Virgin Islands", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United Nations", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Wallis & Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"], exports.languages = ["Akan", "Amharic", "Arabic", "Assamese", "Awadhi", "Azerbaijani", "Balochi", "Belarusian", "Bengali", "Bhojpuri", "Burmese", "Cebuano", "Chewa", "Chhattisgarhi", "Chittagonian", "Czech", "Deccan", "Dhundhari", "Dutch", "English", "French", "Fula", "Gan", "German", "Greek", "Gujarati", "Hakka", "Haryanvi", "Hausa", "Hiligaynon", "Hindi", "Hmong", "Hungarian", "Igbo", "Ilocano", "Italian", "Japanese", "Javanese", "Jin", "Kannada", "Kazakh", "Khmer", "Kinyarwanda", "Kirundi", "Konkani", "Korean", "Kurdish", "Madurese", "Magahi", "Maithili", "Malagasy", "Malay", "Malayalam", "Mandarin", "Marathi", "Marwari", "Min", "Mossi", "Nepali", "Odia", "Oromo", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", "Quechua", "Romanian", "Russian", "Saraiki", "Shona", "Sindhi", "Sinhala", "Somali", "Spanish", "Sundanese", "Swedish", "Sylheti", "Tagalog", "Tamil", "Telugu", "Thai", "Turkish", "Turkmen", "Ukrainian", "Urdu", "Uyghur", "Uzbek", "Vietnamese", "Wu", "Xhosa", "Xiang", "Yoruba", "Yue", "Zhuang", "Zulu"], exports.names = ["Aaren", "Aarika", "Abagael", "Abagail", "Abbe", "Abbey", "Abbi", "Abbie", "Abby", "Abbye", "Abigael", "Abigail", "Abigale", "Abra", "Ada", "Adah", "Adaline", "Adan", "Adara", "Adda", "Addi", "Addia", "Addie", "Addy", "Adel", "Adela", "Adelaida", "Adelaide", "Adele", "Adelheid", "Adelice", "Adelina", "Adelind", "Adeline", "Adella", "Adelle", "Adena", "Adey", "Adi", "Adiana", "Adina", "Adora", "Adore", "Adoree", "Adorne", "Adrea", "Adria", "Adriaens", "Adrian", "Adriana", "Adriane", "Adrianna", "Adrianne", "Adriena", "Adrienne", "Aeriel", "Aeriela", "Aeriell", "Afton", "Ag", "Agace", "Agata", "Agatha", "Agathe", "Aggi", "Aggie", "Aggy", "Agna", "Agnella", "Agnes", "Agnese", "Agnesse", "Agneta", "Agnola", "Agretha", "Aida", "Aidan", "Aigneis", "Aila", "Aile", "Ailee", "Aileen", "Ailene", "Ailey", "Aili", "Ailina", "Ailis", "Ailsun", "Ailyn", "Aime", "Aimee", "Aimil", "Aindrea", "Ainslee", "Ainsley", "Ainslie", "Ajay", "Alaine", "Alameda", "Alana", "Alanah", "Alane", "Alanna", "Alayne", "Alberta", "Albertina", "Albertine", "Albina", "Alecia", "Aleda", "Aleece", "Aleen", "Alejandra", "Alejandrina", "Alena", "Alene", "Alessandra", "Aleta", "Alethea", "Alex", "Alexa", "Alexandra", "Alexandrina", "Alexi", "Alexia", "Alexina", "Alexine", "Alexis", "Alfi", "Alfie", "Alfreda", "Alfy", "Ali", "Alia", "Alica", "Alice", "Alicea", "Alicia", "Alida", "Alidia", "Alie", "Alika", "Alikee", "Alina", "Aline", "Alis", "Alisa", "Alisha", "Alison", "Alissa", "Alisun", "Alix", "Aliza", "Alla", "Alleen", "Allegra", "Allene", "Alli", "Allianora", "Allie", "Allina", "Allis", "Allison", "Allissa", "Allix", "Allsun", "Allx", "Ally", "Allyce", "Allyn", "Allys", "Allyson", "Alma", "Almeda", "Almeria", "Almeta", "Almira", "Almire", "Aloise", "Aloisia", "Aloysia", "Alta", "Althea", "Alvera", "Alverta", "Alvina", "Alvinia", "Alvira", "Alyce", "Alyda", "Alys", "Alysa", "Alyse", "Alysia", "Alyson", "Alyss", "Alyssa", "Amabel", "Amabelle", "Amalea", "Amalee", "Amaleta", "Amalia", "Amalie", "Amalita", "Amalle", "Amanda", "Amandi", "Amandie", "Amandy", "Amara", "Amargo", "Amata", "Amber", "Amberly", "Ambur", "Ame", "Amelia", "Amelie", "Amelina", "Ameline", "Amelita", "Ami", "Amie", "Amii", "Amil", "Amitie", "Amity", "Ammamaria", "Amy", "Amye", "Ana", "Anabal", "Anabel", "Anabella", "Anabelle", "Analiese", "Analise", "Anallese", "Anallise", "Anastasia", "Anastasie", "Anastassia", "Anatola", "Andee", "Andeee", "Anderea", "Andi", "Andie", "Andra", "Andrea", "Andreana", "Andree", "Andrei", "Andria", "Andriana", "Andriette", "Andromache", "Andy", "Anestassia", "Anet", "Anett", "Anetta", "Anette", "Ange", "Angel", "Angela", "Angele", "Angelia", "Angelica", "Angelika", "Angelina", "Angeline", "Angelique", "Angelita", "Angelle", "Angie", "Angil", "Angy", "Ania", "Anica", "Anissa", "Anita", "Anitra", "Anjanette", "Anjela", "Ann", "Ann-marie", "Anna", "Anna-diana", "Anna-diane", "Anna-maria", "Annabal", "Annabel", "Annabela", "Annabell", "Annabella", "Annabelle", "Annadiana", "Annadiane", "Annalee", "Annaliese", "Annalise", "Annamaria", "Annamarie", "Anne", "Anne-corinne", "Anne-marie", "Annecorinne", "Anneliese", "Annelise", "Annemarie", "Annetta", "Annette", "Anni", "Annice", "Annie", "Annis", "Annissa", "Annmaria", "Annmarie", "Annnora", "Annora", "Anny", "Anselma", "Ansley", "Anstice", "Anthe", "Anthea", "Anthia", "Anthiathia", "Antoinette", "Antonella", "Antonetta", "Antonia", "Antonie", "Antonietta", "Antonina", "Anya", "Appolonia", "April", "Aprilette", "Ara", "Arabel", "Arabela", "Arabele", "Arabella", "Arabelle", "Arda", "Ardath", "Ardeen", "Ardelia", "Ardelis", "Ardella", "Ardelle", "Arden", "Ardene", "Ardenia", "Ardine", "Ardis", "Ardisj", "Ardith", "Ardra", "Ardyce", "Ardys", "Ardyth", "Aretha", "Ariadne", "Ariana", "Aridatha", "Ariel", "Ariela", "Ariella", "Arielle", "Arlana", "Arlee", "Arleen", "Arlen", "Arlena", "Arlene", "Arleta", "Arlette", "Arleyne", "Arlie", "Arliene", "Arlina", "Arlinda", "Arline", "Arluene", "Arly", "Arlyn", "Arlyne", "Aryn", "Ashely", "Ashia", "Ashien", "Ashil", "Ashla", "Ashlan", "Ashlee", "Ashleigh", "Ashlen", "Ashley", "Ashli", "Ashlie", "Ashly", "Asia", "Astra", "Astrid", "Astrix", "Atalanta", "Athena", "Athene", "Atlanta", "Atlante", "Auberta", "Aubine", "Aubree", "Aubrette", "Aubrey", "Aubrie", "Aubry", "Audi", "Audie", "Audra", "Audre", "Audrey", "Audrie", "Audry", "Audrye", "Audy", "Augusta", "Auguste", "Augustina", "Augustine", "Aundrea", "Aura", "Aurea", "Aurel", "Aurelea", "Aurelia", "Aurelie", "Auria", "Aurie", "Aurilia", "Aurlie", "Auroora", "Aurora", "Aurore", "Austin", "Austina", "Austine", "Ava", "Aveline", "Averil", "Averyl", "Avie", "Avis", "Aviva", "Avivah", "Avril", "Avrit", "Ayn", "Bab", "Babara", "Babb", "Babbette", "Babbie", "Babette", "Babita", "Babs", "Bambi", "Bambie", "Bamby", "Barb", "Barbabra", "Barbara", "Barbara-anne", "Barbaraanne", "Barbe", "Barbee", "Barbette", "Barbey", "Barbi", "Barbie", "Barbra", "Barby", "Bari", "Barrie", "Barry", "Basia", "Bathsheba", "Batsheva", "Bea", "Beatrice", "Beatrisa", "Beatrix", "Beatriz", "Bebe", "Becca", "Becka", "Becki", "Beckie", "Becky", "Bee", "Beilul", "Beitris", "Bekki", "Bel", "Belia", "Belicia", "Belinda", "Belita", "Bell", "Bella", "Bellanca", "Belle", "Bellina", "Belva", "Belvia", "Bendite", "Benedetta", "Benedicta", "Benedikta", "Benetta", "Benita", "Benni", "Bennie", "Benny", "Benoite", "Berenice", "Beret", "Berget", "Berna", "Bernadene", "Bernadette", "Bernadina", "Bernadine", "Bernardina", "Bernardine", "Bernelle", "Bernete", "Bernetta", "Bernette", "Berni", "Bernice", "Bernie", "Bernita", "Berny", "Berri", "Berrie", "Berry", "Bert", "Berta", "Berte", "Bertha", "Berthe", "Berti", "Bertie", "Bertina", "Bertine", "Berty", "Beryl", "Beryle", "Bess", "Bessie", "Bessy", "Beth", "Bethanne", "Bethany", "Bethena", "Bethina", "Betsey", "Betsy", "Betta", "Bette", "Bette-ann", "Betteann", "Betteanne", "Betti", "Bettina", "Bettine", "Betty", "Bettye", "Beulah", "Bev", "Beverie", "Beverlee", "Beverley", "Beverlie", "Beverly", "Bevvy", "Bianca", "Bianka", "Bibbie", "Bibby", "Bibbye", "Bibi", "Biddie", "Biddy", "Bidget", "Bili", "Bill", "Billi", "Billie", "Billy", "Billye", "Binni", "Binnie", "Binny", "Bird", "Birdie", "Birgit", "Birgitta", "Blair", "Blaire", "Blake", "Blakelee", "Blakeley", "Blanca", "Blanch", "Blancha", "Blanche", "Blinni", "Blinnie", "Blinny", "Bliss", "Blisse", "Blithe", "Blondell", "Blondelle", "Blondie", "Blondy", "Blythe", "Bobbe", "Bobbee", "Bobbette", "Bobbi", "Bobbie", "Bobby", "Bobbye", "Bobette", "Bobina", "Bobine", "Bobinette", "Bonita", "Bonnee", "Bonni", "Bonnibelle", "Bonnie", "Bonny", "Brana", "Brandais", "Brande", "Brandea", "Brandi", "Brandice", "Brandie", "Brandise", "Brandy", "Breanne", "Brear", "Bree", "Breena", "Bren", "Brena", "Brenda", "Brenn", "Brenna", "Brett", "Bria", "Briana", "Brianna", "Brianne", "Bride", "Bridget", "Bridgette", "Bridie", "Brier", "Brietta", "Brigid", "Brigida", "Brigit", "Brigitta", "Brigitte", "Brina", "Briney", "Brinn", "Brinna", "Briny", "Brit", "Brita", "Britney", "Britni", "Britt", "Britta", "Brittan", "Brittaney", "Brittani", "Brittany", "Britte", "Britteny", "Brittne", "Brittney", "Brittni", "Brook", "Brooke", "Brooks", "Brunhilda", "Brunhilde", "Bryana", "Bryn", "Bryna", "Brynn", "Brynna", "Brynne", "Buffy", "Bunni", "Bunnie", "Bunny", "Cacilia", "Cacilie", "Cahra", "Cairistiona", "Caitlin", "Caitrin", "Cal", "Calida", "Calla", "Calley", "Calli", "Callida", "Callie", "Cally", "Calypso", "Cam", "Camala", "Camel", "Camella", "Camellia", "Cami", "Camila", "Camile", "Camilla", "Camille", "Cammi", "Cammie", "Cammy", "Candace", "Candi", "Candice", "Candida", "Candide", "Candie", "Candis", "Candra", "Candy", "Caprice", "Cara", "Caralie", "Caren", "Carena", "Caresa", "Caressa", "Caresse", "Carey", "Cari", "Caria", "Carie", "Caril", "Carilyn", "Carin", "Carina", "Carine", "Cariotta", "Carissa", "Carita", "Caritta", "Carla", "Carlee", "Carleen", "Carlen", "Carlene", "Carley", "Carlie", "Carlin", "Carlina", "Carline", "Carlita", "Carlota", "Carlotta", "Carly", "Carlye", "Carlyn", "Carlynn", "Carlynne", "Carma", "Carmel", "Carmela", "Carmelia", "Carmelina", "Carmelita", "Carmella", "Carmelle", "Carmen", "Carmencita", "Carmina", "Carmine", "Carmita", "Carmon", "Caro", "Carol", "Carol-jean", "Carola", "Carolan", "Carolann", "Carole", "Carolee", "Carolin", "Carolina", "Caroline", "Caroljean", "Carolyn", "Carolyne", "Carolynn", "Caron", "Carree", "Carri", "Carrie", "Carrissa", "Carroll", "Carry", "Cary", "Caryl", "Caryn", "Casandra", "Casey", "Casi", "Casie", "Cass", "Cassandra", "Cassandre", "Cassandry", "Cassaundra", "Cassey", "Cassi", "Cassie", "Cassondra", "Cassy", "Catarina", "Cate", "Caterina", "Catha", "Catharina", "Catharine", "Cathe", "Cathee", "Catherin", "Catherina", "Catherine", "Cathi", "Cathie", "Cathleen", "Cathlene", "Cathrin", "Cathrine", "Cathryn", "Cathy", "Cathyleen", "Cati", "Catie", "Catina", "Catlaina", "Catlee", "Catlin", "Catrina", "Catriona", "Caty", "Caye", "Cayla", "Cecelia", "Cecil", "Cecile", "Ceciley", "Cecilia", "Cecilla", "Cecily", "Ceil", "Cele", "Celene", "Celesta", "Celeste", "Celestia", "Celestina", "Celestine", "Celestyn", "Celestyna", "Celia", "Celie", "Celina", "Celinda", "Celine", "Celinka", "Celisse", "Celka", "Celle", "Cesya", "Chad", "Chanda", "Chandal", "Chandra", "Channa", "Chantal", "Chantalle", "Charil", "Charin", "Charis", "Charissa", "Charisse", "Charita", "Charity", "Charla", "Charlean", "Charleen", "Charlena", "Charlene", "Charline", "Charlot", "Charlotta", "Charlotte", "Charmain", "Charmaine", "Charmane", "Charmian", "Charmine", "Charmion", "Charo", "Charyl", "Chastity", "Chelsae", "Chelsea", "Chelsey", "Chelsie", "Chelsy", "Cher", "Chere", "Cherey", "Cheri", "Cherianne", "Cherice", "Cherida", "Cherie", "Cherilyn", "Cherilynn", "Cherin", "Cherise", "Cherish", "Cherlyn", "Cherri", "Cherrita", "Cherry", "Chery", "Cherye", "Cheryl", "Cheslie", "Chiarra", "Chickie", "Chicky", "Chiquia", "Chiquita", "Chlo", "Chloe", "Chloette", "Chloris", "Chris", "Chrissie", "Chrissy", "Christa", "Christabel", "Christabella", "Christal", "Christalle", "Christan", "Christean", "Christel", "Christen", "Christi", "Christian", "Christiana", "Christiane", "Christie", "Christin", "Christina", "Christine", "Christy", "Christye", "Christyna", "Chrysa", "Chrysler", "Chrystal", "Chryste", "Chrystel", "Cicely", "Cicily", "Ciel", "Cilka", "Cinda", "Cindee", "Cindelyn", "Cinderella", "Cindi", "Cindie", "Cindra", "Cindy", "Cinnamon", "Cissiee", "Cissy", "Clair", "Claire", "Clara", "Clarabelle", "Clare", "Claresta", "Clareta", "Claretta", "Clarette", "Clarey", "Clari", "Claribel", "Clarice", "Clarie", "Clarinda", "Clarine", "Clarissa", "Clarisse", "Clarita", "Clary", "Claude", "Claudelle", "Claudetta", "Claudette", "Claudia", "Claudie", "Claudina", "Claudine", "Clea", "Clem", "Clemence", "Clementia", "Clementina", "Clementine", "Clemmie", "Clemmy", "Cleo", "Cleopatra", "Clerissa", "Clio", "Clo", "Cloe", "Cloris", "Clotilda", "Clovis", "Codee", "Codi", "Codie", "Cody", "Coleen", "Colene", "Coletta", "Colette", "Colleen", "Collen", "Collete", "Collette", "Collie", "Colline", "Colly", "Con", "Concettina", "Conchita", "Concordia", "Conni", "Connie", "Conny", "Consolata", "Constance", "Constancia", "Constancy", "Constanta", "Constantia", "Constantina", "Constantine", "Consuela", "Consuelo", "Cookie", "Cora", "Corabel", "Corabella", "Corabelle", "Coral", "Coralie", "Coraline", "Coralyn", "Cordelia", "Cordelie", "Cordey", "Cordi", "Cordie", "Cordula", "Cordy", "Coreen", "Corella", "Corenda", "Corene", "Coretta", "Corette", "Corey", "Cori", "Corie", "Corilla", "Corina", "Corine", "Corinna", "Corinne", "Coriss", "Corissa", "Corliss", "Corly", "Cornela", "Cornelia", "Cornelle", "Cornie", "Corny", "Correna", "Correy", "Corri", "Corrianne", "Corrie", "Corrina", "Corrine", "Corrinne", "Corry", "Cortney", "Cory", "Cosetta", "Cosette", "Costanza", "Courtenay", "Courtnay", "Courtney", "Crin", "Cris", "Crissie", "Crissy", "Crista", "Cristabel", "Cristal", "Cristen", "Cristi", "Cristie", "Cristin", "Cristina", "Cristine", "Cristionna", "Cristy", "Crysta", "Crystal", "Crystie", "Cthrine", "Cyb", "Cybil", "Cybill", "Cymbre", "Cynde", "Cyndi", "Cyndia", "Cyndie", "Cyndy", "Cynthea", "Cynthia", "Cynthie", "Cynthy", "Dacey", "Dacia", "Dacie", "Dacy", "Dael", "Daffi", "Daffie", "Daffy", "Dagmar", "Dahlia", "Daile", "Daisey", "Daisi", "Daisie", "Daisy", "Dale", "Dalenna", "Dalia", "Dalila", "Dallas", "Daloris", "Damara", "Damaris", "Damita", "Dana", "Danell", "Danella", "Danette", "Dani", "Dania", "Danica", "Danice", "Daniela", "Daniele", "Daniella", "Danielle", "Danika", "Danila", "Danit", "Danita", "Danna", "Danni", "Dannie", "Danny", "Dannye", "Danya", "Danyelle", "Danyette", "Daphene", "Daphna", "Daphne", "Dara", "Darb", "Darbie", "Darby", "Darcee", "Darcey", "Darci", "Darcie", "Darcy", "Darda", "Dareen", "Darell", "Darelle", "Dari", "Daria", "Darice", "Darla", "Darleen", "Darlene", "Darline", "Darlleen", "Daron", "Darrelle", "Darryl", "Darsey", "Darsie", "Darya", "Daryl", "Daryn", "Dasha", "Dasi", "Dasie", "Dasya", "Datha", "Daune", "Daveen", "Daveta", "Davida", "Davina", "Davine", "Davita", "Dawn", "Dawna", "Dayle", "Dayna", "Ddene", "De", "Deana", "Deane", "Deanna", "Deanne", "Deb", "Debbi", "Debbie", "Debby", "Debee", "Debera", "Debi", "Debor", "Debora", "Deborah", "Debra", "Dede", "Dedie", "Dedra", "Dee", "Deeann", "Deeanne", "Deedee", "Deena", "Deerdre", "Deeyn", "Dehlia", "Deidre", "Deina", "Deirdre", "Del", "Dela", "Delcina", "Delcine", "Delia", "Delila", "Delilah", "Delinda", "Dell", "Della", "Delly", "Delora", "Delores", "Deloria", "Deloris", "Delphine", "Delphinia", "Demeter", "Demetra", "Demetria", "Demetris", "Dena", "Deni", "Denice", "Denise", "Denna", "Denni", "Dennie", "Denny", "Deny", "Denys", "Denyse", "Deonne", "Desdemona", "Desirae", "Desiree", "Desiri", "Deva", "Devan", "Devi", "Devin", "Devina", "Devinne", "Devon", "Devondra", "Devonna", "Devonne", "Devora", "Di", "Diahann", "Dian", "Diana", "Diandra", "Diane", "Diane-marie", "Dianemarie", "Diann", "Dianna", "Dianne", "Diannne", "Didi", "Dido", "Diena", "Dierdre", "Dina", "Dinah", "Dinnie", "Dinny", "Dion", "Dione", "Dionis", "Dionne", "Dita", "Dix", "Dixie", "Dniren", "Dode", "Dodi", "Dodie", "Dody", "Doe", "Doll", "Dolley", "Dolli", "Dollie", "Dolly", "Dolores", "Dolorita", "Doloritas", "Domeniga", "Dominga", "Domini", "Dominica", "Dominique", "Dona", "Donella", "Donelle", "Donetta", "Donia", "Donica", "Donielle", "Donna", "Donnamarie", "Donni", "Donnie", "Donny", "Dora", "Doralia", "Doralin", "Doralyn", "Doralynn", "Doralynne", "Dore", "Doreen", "Dorelia", "Dorella", "Dorelle", "Dorena", "Dorene", "Doretta", "Dorette", "Dorey", "Dori", "Doria", "Dorian", "Dorice", "Dorie", "Dorine", "Doris", "Dorisa", "Dorise", "Dorita", "Doro", "Dorolice", "Dorolisa", "Dorotea", "Doroteya", "Dorothea", "Dorothee", "Dorothy", "Dorree", "Dorri", "Dorrie", "Dorris", "Dorry", "Dorthea", "Dorthy", "Dory", "Dosi", "Dot", "Doti", "Dotti", "Dottie", "Dotty", "Dre", "Dreddy", "Dredi", "Drona", "Dru", "Druci", "Drucie", "Drucill", "Drucy", "Drusi", "Drusie", "Drusilla", "Drusy", "Dulce", "Dulcea", "Dulci", "Dulcia", "Dulciana", "Dulcie", "Dulcine", "Dulcinea", "Dulcy", "Dulsea", "Dusty", "Dyan", "Dyana", "Dyane", "Dyann", "Dyanna", "Dyanne", "Dyna", "Dynah", "Eachelle", "Eada", "Eadie", "Eadith", "Ealasaid", "Eartha", "Easter", "Eba", "Ebba", "Ebonee", "Ebony", "Eda", "Eddi", "Eddie", "Eddy", "Ede", "Edee", "Edeline", "Eden", "Edi", "Edie", "Edin", "Edita", "Edith", "Editha", "Edithe", "Ediva", "Edna", "Edwina", "Edy", "Edyth", "Edythe", "Effie", "Eileen", "Eilis", "Eimile", "Eirena", "Ekaterina", "Elaina", "Elaine", "Elana", "Elane", "Elayne", "Elberta", "Elbertina", "Elbertine", "Eleanor", "Eleanora", "Eleanore", "Electra", "Eleen", "Elena", "Elene", "Eleni", "Elenore", "Eleonora", "Eleonore", "Elfie", "Elfreda", "Elfrida", "Elfrieda", "Elga", "Elianora", "Elianore", "Elicia", "Elie", "Elinor", "Elinore", "Elisa", "Elisabet", "Elisabeth", "Elisabetta", "Elise", "Elisha", "Elissa", "Elita", "Eliza", "Elizabet", "Elizabeth", "Elka", "Elke", "Ella", "Elladine", "Elle", "Ellen", "Ellene", "Ellette", "Elli", "Ellie", "Ellissa", "Elly", "Ellyn", "Ellynn", "Elmira", "Elna", "Elnora", "Elnore", "Eloisa", "Eloise", "Elonore", "Elora", "Elsa", "Elsbeth", "Else", "Elset", "Elsey", "Elsi", "Elsie", "Elsinore", "Elspeth", "Elsy", "Elva", "Elvera", "Elvina", "Elvira", "Elwira", "Elyn", "Elyse", "Elysee", "Elysha", "Elysia", "Elyssa", "Em", "Ema", "Emalee", "Emalia", "Emelda", "Emelia", "Emelina", "Emeline", "Emelita", "Emelyne", "Emera", "Emilee", "Emili", "Emilia", "Emilie", "Emiline", "Emily", "Emlyn", "Emlynn", "Emlynne", "Emma", "Emmalee", "Emmaline", "Emmalyn", "Emmalynn", "Emmalynne", "Emmeline", "Emmey", "Emmi", "Emmie", "Emmy", "Emmye", "Emogene", "Emyle", "Emylee", "Engracia", "Enid", "Enrica", "Enrichetta", "Enrika", "Enriqueta", "Eolanda", "Eolande", "Eran", "Erda", "Erena", "Erica", "Ericha", "Ericka", "Erika", "Erin", "Erina", "Erinn", "Erinna", "Erma", "Ermengarde", "Ermentrude", "Ermina", "Erminia", "Erminie", "Erna", "Ernaline", "Ernesta", "Ernestine", "Ertha", "Eryn", "Esma", "Esmaria", "Esme", "Esmeralda", "Essa", "Essie", "Essy", "Esta", "Estel", "Estele", "Estell", "Estella", "Estelle", "Ester", "Esther", "Estrella", "Estrellita", "Ethel", "Ethelda", "Ethelin", "Ethelind", "Etheline", "Ethelyn", "Ethyl", "Etta", "Etti", "Ettie", "Etty", "Eudora", "Eugenia", "Eugenie", "Eugine", "Eula", "Eulalie", "Eunice", "Euphemia", "Eustacia", "Eva", "Evaleen", "Evangelia", "Evangelin", "Evangelina", "Evangeline", "Evania", "Evanne", "Eve", "Eveleen", "Evelina", "Eveline", "Evelyn", "Evey", "Evie", "Evita", "Evonne", "Evvie", "Evvy", "Evy", "Eyde", "Eydie", "Ezmeralda", "Fae", "Faina", "Faith", "Fallon", "Fan", "Fanchette", "Fanchon", "Fancie", "Fancy", "Fanechka", "Fania", "Fanni", "Fannie", "Fanny", "Fanya", "Fara", "Farah", "Farand", "Farica", "Farra", "Farrah", "Farrand", "Faun", "Faunie", "Faustina", "Faustine", "Fawn", "Fawne", "Fawnia", "Fay", "Faydra", "Faye", "Fayette", "Fayina", "Fayre", "Fayth", "Faythe", "Federica", "Fedora", "Felecia", "Felicdad", "Felice", "Felicia", "Felicity", "Felicle", "Felipa", "Felisha", "Felita", "Feliza", "Fenelia", "Feodora", "Ferdinanda", "Ferdinande", "Fern", "Fernanda", "Fernande", "Fernandina", "Ferne", "Fey", "Fiann", "Fianna", "Fidela", "Fidelia", "Fidelity", "Fifi", "Fifine", "Filia", "Filide", "Filippa", "Fina", "Fiona", "Fionna", "Fionnula", "Fiorenze", "Fleur", "Fleurette", "Flo", "Flor", "Flora", "Florance", "Flore", "Florella", "Florence", "Florencia", "Florentia", "Florenza", "Florette", "Flori", "Floria", "Florida", "Florie", "Florina", "Florinda", "Floris", "Florri", "Florrie", "Florry", "Flory", "Flossi", "Flossie", "Flossy", "Flss", "Fran", "Francene", "Frances", "Francesca", "Francine", "Francisca", "Franciska", "Francoise", "Francyne", "Frank", "Frankie", "Franky", "Franni", "Frannie", "Franny", "Frayda", "Fred", "Freda", "Freddi", "Freddie", "Freddy", "Fredelia", "Frederica", "Fredericka", "Frederique", "Fredi", "Fredia", "Fredra", "Fredrika", "Freida", "Frieda", "Friederike", "Fulvia", "Gabbey", "Gabbi", "Gabbie", "Gabey", "Gabi", "Gabie", "Gabriel", "Gabriela", "Gabriell", "Gabriella", "Gabrielle", "Gabriellia", "Gabrila", "Gaby", "Gae", "Gael", "Gail", "Gale", "Galina", "Garland", "Garnet", "Garnette", "Gates", "Gavra", "Gavrielle", "Gay", "Gaye", "Gayel", "Gayla", "Gayle", "Gayleen", "Gaylene", "Gaynor", "Gelya", "Gena", "Gene", "Geneva", "Genevieve", "Genevra", "Genia", "Genna", "Genni", "Gennie", "Gennifer", "Genny", "Genovera", "Genvieve", "George", "Georgeanna", "Georgeanne", "Georgena", "Georgeta", "Georgetta", "Georgette", "Georgia", "Georgiana", "Georgianna", "Georgianne", "Georgie", "Georgina", "Georgine", "Geralda", "Geraldine", "Gerda", "Gerhardine", "Geri", "Gerianna", "Gerianne", "Gerladina", "Germain", "Germaine", "Germana", "Gerri", "Gerrie", "Gerrilee", "Gerry", "Gert", "Gerta", "Gerti", "Gertie", "Gertrud", "Gertruda", "Gertrude", "Gertrudis", "Gerty", "Giacinta", "Giana", "Gianina", "Gianna", "Gigi", "Gilberta", "Gilberte", "Gilbertina", "Gilbertine", "Gilda", "Gilemette", "Gill", "Gillan", "Gilli", "Gillian", "Gillie", "Gilligan", "Gilly", "Gina", "Ginelle", "Ginevra", "Ginger", "Ginni", "Ginnie", "Ginnifer", "Ginny", "Giorgia", "Giovanna", "Gipsy", "Giralda", "Gisela", "Gisele", "Gisella", "Giselle", "Giuditta", "Giulia", "Giulietta", "Giustina", "Gizela", "Glad", "Gladi", "Gladys", "Gleda", "Glen", "Glenda", "Glenine", "Glenn", "Glenna", "Glennie", "Glennis", "Glori", "Gloria", "Gloriana", "Gloriane", "Glory", "Glyn", "Glynda", "Glynis", "Glynnis", "Gnni", "Godiva", "Golda", "Goldarina", "Goldi", "Goldia", "Goldie", "Goldina", "Goldy", "Grace", "Gracia", "Gracie", "Grata", "Gratia", "Gratiana", "Gray", "Grayce", "Grazia", "Greer", "Greta", "Gretal", "Gretchen", "Grete", "Gretel", "Grethel", "Gretna", "Gretta", "Grier", "Griselda", "Grissel", "Guendolen", "Guenevere", "Guenna", "Guglielma", "Gui", "Guillema", "Guillemette", "Guinevere", "Guinna", "Gunilla", "Gus", "Gusella", "Gussi", "Gussie", "Gussy", "Gusta", "Gusti", "Gustie", "Gusty", "Gwen", "Gwendolen", "Gwendolin", "Gwendolyn", "Gweneth", "Gwenette", "Gwenneth", "Gwenni", "Gwennie", "Gwenny", "Gwenora", "Gwenore", "Gwyn", "Gwyneth", "Gwynne", "Gypsy", "Hadria", "Hailee", "Haily", "Haleigh", "Halette", "Haley", "Hali", "Halie", "Halimeda", "Halley", "Halli", "Hallie", "Hally", "Hana", "Hanna", "Hannah", "Hanni", "Hannie", "Hannis", "Hanny", "Happy", "Harlene", "Harley", "Harli", "Harlie", "Harmonia", "Harmonie", "Harmony", "Harri", "Harrie", "Harriet", "Harriett", "Harrietta", "Harriette", "Harriot", "Harriott", "Hatti", "Hattie", "Hatty", "Hayley", "Hazel", "Heath", "Heather", "Heda", "Hedda", "Heddi", "Heddie", "Hedi", "Hedvig", "Hedvige", "Hedwig", "Hedwiga", "Hedy", "Heida", "Heidi", "Heidie", "Helaina", "Helaine", "Helen", "Helen-elizabeth", "Helena", "Helene", "Helenka", "Helga", "Helge", "Helli", "Heloise", "Helsa", "Helyn", "Hendrika", "Henka", "Henrie", "Henrieta", "Henrietta", "Henriette", "Henryetta", "Hephzibah", "Hermia", "Hermina", "Hermine", "Herminia", "Hermione", "Herta", "Hertha", "Hester", "Hesther", "Hestia", "Hetti", "Hettie", "Hetty", "Hilary", "Hilda", "Hildagard", "Hildagarde", "Hilde", "Hildegaard", "Hildegarde", "Hildy", "Hillary", "Hilliary", "Hinda", "Holli", "Hollie", "Holly", "Holly-anne", "Hollyanne", "Honey", "Honor", "Honoria", "Hope", "Horatia", "Hortense", "Hortensia", "Hulda", "Hyacinth", "Hyacintha", "Hyacinthe", "Hyacinthia", "Hyacinthie", "Hynda", "Ianthe", "Ibbie", "Ibby", "Ida", "Idalia", "Idalina", "Idaline", "Idell", "Idelle", "Idette", "Ileana", "Ileane", "Ilene", "Ilise", "Ilka", "Illa", "Ilsa", "Ilse", "Ilysa", "Ilyse", "Ilyssa", "Imelda", "Imogen", "Imogene", "Imojean", "Ina", "Indira", "Ines", "Inesita", "Inessa", "Inez", "Inga", "Ingaberg", "Ingaborg", "Inge", "Ingeberg", "Ingeborg", "Inger", "Ingrid", "Ingunna", "Inna", "Iolande", "Iolanthe", "Iona", "Iormina", "Ira", "Irena", "Irene", "Irina", "Iris", "Irita", "Irma", "Isa", "Isabel", "Isabelita", "Isabella", "Isabelle", "Isadora", "Isahella", "Iseabal", "Isidora", "Isis", "Isobel", "Issi", "Issie", "Issy", "Ivett", "Ivette", "Ivie", "Ivonne", "Ivory", "Ivy", "Izabel", "Jacenta", "Jacinda", "Jacinta", "Jacintha", "Jacinthe", "Jackelyn", "Jacki", "Jackie", "Jacklin", "Jacklyn", "Jackquelin", "Jackqueline", "Jacky", "Jaclin", "Jaclyn", "Jacquelin", "Jacqueline", "Jacquelyn", "Jacquelynn", "Jacquenetta", "Jacquenette", "Jacquetta", "Jacquette", "Jacqui", "Jacquie", "Jacynth", "Jada", "Jade", "Jaime", "Jaimie", "Jaine", "Jami", "Jamie", "Jamima", "Jammie", "Jan", "Jana", "Janaya", "Janaye", "Jandy", "Jane", "Janean", "Janeczka", "Janeen", "Janel", "Janela", "Janella", "Janelle", "Janene", "Janenna", "Janessa", "Janet", "Janeta", "Janetta", "Janette", "Janeva", "Janey", "Jania", "Janice", "Janie", "Janifer", "Janina", "Janine", "Janis", "Janith", "Janka", "Janna", "Jannel", "Jannelle", "Janot", "Jany", "Jaquelin", "Jaquelyn", "Jaquenetta", "Jaquenette", "Jaquith", "Jasmin", "Jasmina", "Jasmine", "Jayme", "Jaymee", "Jayne", "Jaynell", "Jazmin", "Jean", "Jeana", "Jeane", "Jeanelle", "Jeanette", "Jeanie", "Jeanine", "Jeanna", "Jeanne", "Jeannette", "Jeannie", "Jeannine", "Jehanna", "Jelene", "Jemie", "Jemima", "Jemimah", "Jemmie", "Jemmy", "Jen", "Jena", "Jenda", "Jenelle", "Jeni", "Jenica", "Jeniece", "Jenifer", "Jeniffer", "Jenilee", "Jenine", "Jenn", "Jenna", "Jennee", "Jennette", "Jenni", "Jennica", "Jennie", "Jennifer", "Jennilee", "Jennine", "Jenny", "Jeralee", "Jere", "Jeri", "Jermaine", "Jerrie", "Jerrilee", "Jerrilyn", "Jerrine", "Jerry", "Jerrylee", "Jess", "Jessa", "Jessalin", "Jessalyn", "Jessamine", "Jessamyn", "Jesse", "Jesselyn", "Jessi", "Jessica", "Jessie", "Jessika", "Jessy", "Jewel", "Jewell", "Jewelle", "Jill", "Jillana", "Jillane", "Jillayne", "Jilleen", "Jillene", "Jilli", "Jillian", "Jillie", "Jilly", "Jinny", "Jo", "Jo-ann", "Jo-anne", "Joan", "Joana", "Joane", "Joanie", "Joann", "Joanna", "Joanne", "Joannes", "Jobey", "Jobi", "Jobie", "Jobina", "Joby", "Jobye", "Jobyna", "Jocelin", "Joceline", "Jocelyn", "Jocelyne", "Jodee", "Jodi", "Jodie", "Jody", "Joeann", "Joela", "Joelie", "Joell", "Joella", "Joelle", "Joellen", "Joelly", "Joellyn", "Joelynn", "Joete", "Joey", "Johanna", "Johannah", "Johna", "Johnath", "Johnette", "Johnna", "Joice", "Jojo", "Jolee", "Joleen", "Jolene", "Joletta", "Joli", "Jolie", "Joline", "Joly", "Jolyn", "Jolynn", "Jonell", "Joni", "Jonie", "Jonis", "Jordain", "Jordan", "Jordana", "Jordanna", "Jorey", "Jori", "Jorie", "Jorrie", "Jorry", "Joscelin", "Josee", "Josefa", "Josefina", "Josepha", "Josephina", "Josephine", "Josey", "Josi", "Josie", "Josselyn", "Josy", "Jourdan", "Joy", "Joya", "Joyan", "Joyann", "Joyce", "Joycelin", "Joye", "Jsandye", "Juana", "Juanita", "Judi", "Judie", "Judith", "Juditha", "Judy", "Judye", "Juieta", "Julee", "Juli", "Julia", "Juliana", "Juliane", "Juliann", "Julianna", "Julianne", "Julie", "Julienne", "Juliet", "Julieta", "Julietta", "Juliette", "Julina", "Juline", "Julissa", "Julita", "June", "Junette", "Junia", "Junie", "Junina", "Justina", "Justine", "Justinn", "Jyoti", "Kacey", "Kacie", "Kacy", "Kaela", "Kai", "Kaia", "Kaila", "Kaile", "Kailey", "Kaitlin", "Kaitlyn", "Kaitlynn", "Kaja", "Kakalina", "Kala", "Kaleena", "Kali", "Kalie", "Kalila", "Kalina", "Kalinda", "Kalindi", "Kalli", "Kally", "Kameko", "Kamila", "Kamilah", "Kamillah", "Kandace", "Kandy", "Kania", "Kanya", "Kara", "Kara-lynn", "Karalee", "Karalynn", "Kare", "Karee", "Karel", "Karen", "Karena", "Kari", "Karia", "Karie", "Karil", "Karilynn", "Karin", "Karina", "Karine", "Kariotta", "Karisa", "Karissa", "Karita", "Karla", "Karlee", "Karleen", "Karlen", "Karlene", "Karlie", "Karlotta", "Karlotte", "Karly", "Karlyn", "Karmen", "Karna", "Karol", "Karola", "Karole", "Karolina", "Karoline", "Karoly", "Karon", "Karrah", "Karrie", "Karry", "Kary", "Karyl", "Karylin", "Karyn", "Kasey", "Kass", "Kassandra", "Kassey", "Kassi", "Kassia", "Kassie", "Kat", "Kata", "Katalin", "Kate", "Katee", "Katerina", "Katerine", "Katey", "Kath", "Katha", "Katharina", "Katharine", "Katharyn", "Kathe", "Katherina", "Katherine", "Katheryn", "Kathi", "Kathie", "Kathleen", "Kathlin", "Kathrine", "Kathryn", "Kathryne", "Kathy", "Kathye", "Kati", "Katie", "Katina", "Katine", "Katinka", "Katleen", "Katlin", "Katrina", "Katrine", "Katrinka", "Katti", "Kattie", "Katuscha", "Katusha", "Katy", "Katya", "Kay", "Kaycee", "Kaye", "Kayla", "Kayle", "Kaylee", "Kayley", "Kaylil", "Kaylyn", "Keeley", "Keelia", "Keely", "Kelcey", "Kelci", "Kelcie", "Kelcy", "Kelila", "Kellen", "Kelley", "Kelli", "Kellia", "Kellie", "Kellina", "Kellsie", "Kelly", "Kellyann", "Kelsey", "Kelsi", "Kelsy", "Kendra", "Kendre", "Kenna", "Keri", "Keriann", "Kerianne", "Kerri", "Kerrie", "Kerrill", "Kerrin", "Kerry", "Kerstin", "Kesley", "Keslie", "Kessia", "Kessiah", "Ketti", "Kettie", "Ketty", "Kevina", "Kevyn", "Ki", "Kiah", "Kial", "Kiele", "Kiersten", "Kikelia", "Kiley", "Kim", "Kimberlee", "Kimberley", "Kimberli", "Kimberly", "Kimberlyn", "Kimbra", "Kimmi", "Kimmie", "Kimmy", "Kinna", "Kip", "Kipp", "Kippie", "Kippy", "Kira", "Kirbee", "Kirbie", "Kirby", "Kiri", "Kirsten", "Kirsteni", "Kirsti", "Kirstin", "Kirstyn", "Kissee", "Kissiah", "Kissie", "Kit", "Kitti", "Kittie", "Kitty", "Kizzee", "Kizzie", "Klara", "Klarika", "Klarrisa", "Konstance", "Konstanze", "Koo", "Kora", "Koral", "Koralle", "Kordula", "Kore", "Korella", "Koren", "Koressa", "Kori", "Korie", "Korney", "Korrie", "Korry", "Kris", "Krissie", "Krissy", "Krista", "Kristal", "Kristan", "Kriste", "Kristel", "Kristen", "Kristi", "Kristien", "Kristin", "Kristina", "Kristine", "Kristy", "Kristyn", "Krysta", "Krystal", "Krystalle", "Krystle", "Krystyna", "Kyla", "Kyle", "Kylen", "Kylie", "Kylila", "Kylynn", "Kym", "Kynthia", "Kyrstin", "Lacee", "Lacey", "Lacie", "Lacy", "Ladonna", "Laetitia", "Laina", "Lainey", "Lana", "Lanae", "Lane", "Lanette", "Laney", "Lani", "Lanie", "Lanita", "Lanna", "Lanni", "Lanny", "Lara", "Laraine", "Lari", "Larina", "Larine", "Larisa", "Larissa", "Lark", "Laryssa", "Latashia", "Latia", "Latisha", "Latrena", "Latrina", "Laura", "Lauraine", "Laural", "Lauralee", "Laure", "Lauree", "Laureen", "Laurel", "Laurella", "Lauren", "Laurena", "Laurene", "Lauretta", "Laurette", "Lauri", "Laurianne", "Laurice", "Laurie", "Lauryn", "Lavena", "Laverna", "Laverne", "Lavina", "Lavinia", "Lavinie", "Layla", "Layne", "Layney", "Lea", "Leah", "Leandra", "Leann", "Leanna", "Leanor", "Leanora", "Lebbie", "Leda", "Lee", "Leeann", "Leeanne", "Leela", "Leelah", "Leena", "Leesa", "Leese", "Legra", "Leia", "Leigh", "Leigha", "Leila", "Leilah", "Leisha", "Lela", "Lelah", "Leland", "Lelia", "Lena", "Lenee", "Lenette", "Lenka", "Lenna", "Lenora", "Lenore", "Leodora", "Leoine", "Leola", "Leoline", "Leona", "Leonanie", "Leone", "Leonelle", "Leonie", "Leonora", "Leonore", "Leontine", "Leontyne", "Leora", "Leshia", "Lesley", "Lesli", "Leslie", "Lesly", "Lesya", "Leta", "Lethia", "Leticia", "Letisha", "Letitia", "Letizia", "Letta", "Letti", "Lettie", "Letty", "Lexi", "Lexie", "Lexine", "Lexis", "Lexy", "Leyla", "Lezlie", "Lia", "Lian", "Liana", "Liane", "Lianna", "Lianne", "Lib", "Libbey", "Libbi", "Libbie", "Libby", "Licha", "Lida", "Lidia", "Liesa", "Lil", "Lila", "Lilah", "Lilas", "Lilia", "Lilian", "Liliane", "Lilias", "Lilith", "Lilla", "Lilli", "Lillian", "Lillis", "Lilllie", "Lilly", "Lily", "Lilyan", "Lin", "Lina", "Lind", "Linda", "Lindi", "Lindie", "Lindsay", "Lindsey", "Lindsy", "Lindy", "Linea", "Linell", "Linet", "Linette", "Linn", "Linnea", "Linnell", "Linnet", "Linnie", "Linzy", "Lira", "Lisa", "Lisabeth", "Lisbeth", "Lise", "Lisetta", "Lisette", "Lisha", "Lishe", "Lissa", "Lissi", "Lissie", "Lissy", "Lita", "Liuka", "Liv", "Liva", "Livia", "Livvie", "Livvy", "Livvyy", "Livy", "Liz", "Liza", "Lizabeth", "Lizbeth", "Lizette", "Lizzie", "Lizzy", "Loella", "Lois", "Loise", "Lola", "Loleta", "Lolita", "Lolly", "Lona", "Lonee", "Loni", "Lonna", "Lonni", "Lonnie", "Lora", "Lorain", "Loraine", "Loralee", "Loralie", "Loralyn", "Loree", "Loreen", "Lorelei", "Lorelle", "Loren", "Lorena", "Lorene", "Lorenza", "Loretta", "Lorette", "Lori", "Loria", "Lorianna", "Lorianne", "Lorie", "Lorilee", "Lorilyn", "Lorinda", "Lorine", "Lorita", "Lorna", "Lorne", "Lorraine", "Lorrayne", "Lorri", "Lorrie", "Lorrin", "Lorry", "Lory", "Lotta", "Lotte", "Lotti", "Lottie", "Lotty", "Lou", "Louella", "Louisa", "Louise", "Louisette", "Loutitia", "Lu", "Luce", "Luci", "Lucia", "Luciana", "Lucie", "Lucienne", "Lucila", "Lucilia", "Lucille", "Lucina", "Lucinda", "Lucine", "Lucita", "Lucky", "Lucretia", "Lucy", "Ludovika", "Luella", "Luelle", "Luisa", "Luise", "Lula", "Lulita", "Lulu", "Lura", "Lurette", "Lurleen", "Lurlene", "Lurline", "Lusa", "Luz", "Lyda", "Lydia", "Lydie", "Lyn", "Lynda", "Lynde", "Lyndel", "Lyndell", "Lyndsay", "Lyndsey", "Lyndsie", "Lyndy", "Lynea", "Lynelle", "Lynett", "Lynette", "Lynn", "Lynna", "Lynne", "Lynnea", "Lynnell", "Lynnelle", "Lynnet", "Lynnett", "Lynnette", "Lynsey", "Lyssa", "Mab", "Mabel", "Mabelle", "Mable", "Mada", "Madalena", "Madalyn", "Maddalena", "Maddi", "Maddie", "Maddy", "Madel", "Madelaine", "Madeleine", "Madelena", "Madelene", "Madelin", "Madelina", "Madeline", "Madella", "Madelle", "Madelon", "Madelyn", "Madge", "Madlen", "Madlin", "Madonna", "Mady", "Mae", "Maegan", "Mag", "Magda", "Magdaia", "Magdalen", "Magdalena", "Magdalene", "Maggee", "Maggi", "Maggie", "Maggy", "Mahala", "Mahalia", "Maia", "Maible", "Maiga", "Maighdiln", "Mair", "Maire", "Maisey", "Maisie", "Maitilde", "Mala", "Malanie", "Malena", "Malia", "Malina", "Malinda", "Malinde", "Malissa", "Malissia", "Mallissa", "Mallorie", "Mallory", "Malorie", "Malory", "Malva", "Malvina", "Malynda", "Mame", "Mamie", "Manda", "Mandi", "Mandie", "Mandy", "Manon", "Manya", "Mara", "Marabel", "Marcela", "Marcelia", "Marcella", "Marcelle", "Marcellina", "Marcelline", "Marchelle", "Marci", "Marcia", "Marcie", "Marcile", "Marcille", "Marcy", "Mareah", "Maren", "Marena", "Maressa", "Marga", "Margalit", "Margalo", "Margaret", "Margareta", "Margarete", "Margaretha", "Margarethe", "Margaretta", "Margarette", "Margarita", "Margaux", "Marge", "Margeaux", "Margery", "Marget", "Margette", "Margi", "Margie", "Margit", "Margo", "Margot", "Margret", "Marguerite", "Margy", "Mari", "Maria", "Mariam", "Marian", "Mariana", "Mariann", "Marianna", "Marianne", "Maribel", "Maribelle", "Maribeth", "Marice", "Maridel", "Marie", "Marie-ann", "Marie-jeanne", "Marieann", "Mariejeanne", "Mariel", "Mariele", "Marielle", "Mariellen", "Marietta", "Mariette", "Marigold", "Marijo", "Marika", "Marilee", "Marilin", "Marillin", "Marilyn", "Marin", "Marina", "Marinna", "Marion", "Mariquilla", "Maris", "Marisa", "Mariska", "Marissa", "Marita", "Maritsa", "Mariya", "Marj", "Marja", "Marje", "Marji", "Marjie", "Marjorie", "Marjory", "Marjy", "Marketa", "Marla", "Marlane", "Marleah", "Marlee", "Marleen", "Marlena", "Marlene", "Marley", "Marlie", "Marline", "Marlo", "Marlyn", "Marna", "Marne", "Marney", "Marni", "Marnia", "Marnie", "Marquita", "Marrilee", "Marris", "Marrissa", "Marsha", "Marsiella", "Marta", "Martelle", "Martguerita", "Martha", "Marthe", "Marthena", "Marti", "Martica", "Martie", "Martina", "Martita", "Marty", "Martynne", "Mary", "Marya", "Maryann", "Maryanna", "Maryanne", "Marybelle", "Marybeth", "Maryellen", "Maryjane", "Maryjo", "Maryl", "Marylee", "Marylin", "Marylinda", "Marylou", "Marylynne", "Maryrose", "Marys", "Marysa", "Masha", "Matelda", "Mathilda", "Mathilde", "Matilda", "Matilde", "Matti", "Mattie", "Matty", "Maud", "Maude", "Maudie", "Maura", "Maure", "Maureen", "Maureene", "Maurene", "Maurine", "Maurise", "Maurita", "Maurizia", "Mavis", "Mavra", "Max", "Maxi", "Maxie", "Maxine", "Maxy", "May", "Maybelle", "Maye", "Mead", "Meade", "Meagan", "Meaghan", "Meara", "Mechelle", "Meg", "Megan", "Megen", "Meggi", "Meggie", "Meggy", "Meghan", "Meghann", "Mehetabel", "Mei", "Mel", "Mela", "Melamie", "Melania", "Melanie", "Melantha", "Melany", "Melba", "Melesa", "Melessa", "Melicent", "Melina", "Melinda", "Melinde", "Melisa", "Melisande", "Melisandra", "Melisenda", "Melisent", "Melissa", "Melisse", "Melita", "Melitta", "Mella", "Melli", "Mellicent", "Mellie", "Mellisa", "Mellisent", "Melloney", "Melly", "Melodee", "Melodie", "Melody", "Melonie", "Melony", "Melosa", "Melva", "Mercedes", "Merci", "Mercie", "Mercy", "Meredith", "Meredithe", "Meridel", "Meridith", "Meriel", "Merilee", "Merilyn", "Meris", "Merissa", "Merl", "Merla", "Merle", "Merlina", "Merline", "Merna", "Merola", "Merralee", "Merridie", "Merrie", "Merrielle", "Merrile", "Merrilee", "Merrili", "Merrill", "Merrily", "Merry", "Mersey", "Meryl", "Meta", "Mia", "Micaela", "Michaela", "Michaelina", "Michaeline", "Michaella", "Michal", "Michel", "Michele", "Michelina", "Micheline", "Michell", "Michelle", "Micki", "Mickie", "Micky", "Midge", "Mignon", "Mignonne", "Miguela", "Miguelita", "Mikaela", "Mil", "Mildred", "Mildrid", "Milena", "Milicent", "Milissent", "Milka", "Milli", "Millicent", "Millie", "Millisent", "Milly", "Milzie", "Mimi", "Min", "Mina", "Minda", "Mindy", "Minerva", "Minetta", "Minette", "Minna", "Minnaminnie", "Minne", "Minni", "Minnie", "Minnnie", "Minny", "Minta", "Miquela", "Mira", "Mirabel", "Mirabella", "Mirabelle", "Miran", "Miranda", "Mireielle", "Mireille", "Mirella", "Mirelle", "Miriam", "Mirilla", "Mirna", "Misha", "Missie", "Missy", "Misti", "Misty", "Mitzi", "Modesta", "Modestia", "Modestine", "Modesty", "Moina", "Moira", "Moll", "Mollee", "Molli", "Mollie", "Molly", "Mommy", "Mona", "Monah", "Monica", "Monika", "Monique", "Mora", "Moreen", "Morena", "Morgan", "Morgana", "Morganica", "Morganne", "Morgen", "Moria", "Morissa", "Morna", "Moselle", "Moyna", "Moyra", "Mozelle", "Muffin", "Mufi", "Mufinella", "Muire", "Mureil", "Murial", "Muriel", "Murielle", "Myra", "Myrah", "Myranda", "Myriam", "Myrilla", "Myrle", "Myrlene", "Myrna", "Myrta", "Myrtia", "Myrtice", "Myrtie", "Myrtle", "Nada", "Nadean", "Nadeen", "Nadia", "Nadine", "Nadiya", "Nady", "Nadya", "Nalani", "Nan", "Nana", "Nananne", "Nance", "Nancee", "Nancey", "Nanci", "Nancie", "Nancy", "Nanete", "Nanette", "Nani", "Nanice", "Nanine", "Nannette", "Nanni", "Nannie", "Nanny", "Nanon", "Naoma", "Naomi", "Nara", "Nari", "Nariko", "Nat", "Nata", "Natala", "Natalee", "Natalie", "Natalina", "Nataline", "Natalya", "Natasha", "Natassia", "Nathalia", "Nathalie", "Natividad", "Natka", "Natty", "Neala", "Neda", "Nedda", "Nedi", "Neely", "Neila", "Neile", "Neilla", "Neille", "Nelia", "Nelie", "Nell", "Nelle", "Nelli", "Nellie", "Nelly", "Nerissa", "Nerita", "Nert", "Nerta", "Nerte", "Nerti", "Nertie", "Nerty", "Nessa", "Nessi", "Nessie", "Nessy", "Nesta", "Netta", "Netti", "Nettie", "Nettle", "Netty", "Nevsa", "Neysa", "Nichol", "Nichole", "Nicholle", "Nicki", "Nickie", "Nicky", "Nicol", "Nicola", "Nicole", "Nicolea", "Nicolette", "Nicoli", "Nicolina", "Nicoline", "Nicolle", "Nikaniki", "Nike", "Niki", "Nikki", "Nikkie", "Nikoletta", "Nikolia", "Nina", "Ninetta", "Ninette", "Ninnetta", "Ninnette", "Ninon", "Nissa", "Nisse", "Nissie", "Nissy", "Nita", "Nixie", "Noami", "Noel", "Noelani", "Noell", "Noella", "Noelle", "Noellyn", "Noelyn", "Noemi", "Nola", "Nolana", "Nolie", "Nollie", "Nomi", "Nona", "Nonah", "Noni", "Nonie", "Nonna", "Nonnah", "Nora", "Norah", "Norean", "Noreen", "Norene", "Norina", "Norine", "Norma", "Norri", "Norrie", "Norry", "Novelia", "Nydia", "Nyssa", "Octavia", "Odele", "Odelia", "Odelinda", "Odella", "Odelle", "Odessa", "Odetta", "Odette", "Odilia", "Odille", "Ofelia", "Ofella", "Ofilia", "Ola", "Olenka", "Olga", "Olia", "Olimpia", "Olive", "Olivette", "Olivia", "Olivie", "Oliy", "Ollie", "Olly", "Olva", "Olwen", "Olympe", "Olympia", "Olympie", "Ondrea", "Oneida", "Onida", "Oona", "Opal", "Opalina", "Opaline", "Ophelia", "Ophelie", "Ora", "Oralee", "Oralia", "Oralie", "Oralla", "Oralle", "Orel", "Orelee", "Orelia", "Orelie", "Orella", "Orelle", "Oriana", "Orly", "Orsa", "Orsola", "Ortensia", "Otha", "Othelia", "Othella", "Othilia", "Othilie", "Ottilie", "Page", "Paige", "Paloma", "Pam", "Pamela", "Pamelina", "Pamella", "Pammi", "Pammie", "Pammy", "Pandora", "Pansie", "Pansy", "Paola", "Paolina", "Papagena", "Pat", "Patience", "Patrica", "Patrice", "Patricia", "Patrizia", "Patsy", "Patti", "Pattie", "Patty", "Paula", "Paule", "Pauletta", "Paulette", "Pauli", "Paulie", "Paulina", "Pauline", "Paulita", "Pauly", "Pavia", "Pavla", "Pearl", "Pearla", "Pearle", "Pearline", "Peg", "Pegeen", "Peggi", "Peggie", "Peggy", "Pen", "Penelopa", "Penelope", "Penni", "Pennie", "Penny", "Pepi", "Pepita", "Peri", "Peria", "Perl", "Perla", "Perle", "Perri", "Perrine", "Perry", "Persis", "Pet", "Peta", "Petra", "Petrina", "Petronella", "Petronia", "Petronilla", "Petronille", "Petunia", "Phaedra", "Phaidra", "Phebe", "Phedra", "Phelia", "Phil", "Philipa", "Philippa", "Philippe", "Philippine", "Philis", "Phillida", "Phillie", "Phillis", "Philly", "Philomena", "Phoebe", "Phylis", "Phyllida", "Phyllis", "Phyllys", "Phylys", "Pia", "Pier", "Pierette", "Pierrette", "Pietra", "Piper", "Pippa", "Pippy", "Polly", "Pollyanna", "Pooh", "Poppy", "Portia", "Pris", "Prisca", "Priscella", "Priscilla", "Prissie", "Pru", "Prudence", "Prudi", "Prudy", "Prue", "Queenie", "Quentin", "Querida", "Quinn", "Quinta", "Quintana", "Quintilla", "Quintina", "Rachael", "Rachel", "Rachele", "Rachelle", "Rae", "Raeann", "Raf", "Rafa", "Rafaela", "Rafaelia", "Rafaelita", "Rahal", "Rahel", "Raina", "Raine", "Rakel", "Ralina", "Ramona", "Ramonda", "Rana", "Randa", "Randee", "Randene", "Randi", "Randie", "Randy", "Ranee", "Rani", "Rania", "Ranice", "Ranique", "Ranna", "Raphaela", "Raquel", "Raquela", "Rasia", "Rasla", "Raven", "Ray", "Raychel", "Raye", "Rayna", "Raynell", "Rayshell", "Rea", "Reba", "Rebbecca", "Rebe", "Rebeca", "Rebecca", "Rebecka", "Rebeka", "Rebekah", "Rebekkah", "Ree", "Reeba", "Reena", "Reeta", "Reeva", "Regan", "Reggi", "Reggie", "Regina", "Regine", "Reiko", "Reina", "Reine", "Remy", "Rena", "Renae", "Renata", "Renate", "Rene", "Renee", "Renell", "Renelle", "Renie", "Rennie", "Reta", "Retha", "Revkah", "Rey", "Reyna", "Rhea", "Rheba", "Rheta", "Rhetta", "Rhiamon", "Rhianna", "Rhianon", "Rhoda", "Rhodia", "Rhodie", "Rhody", "Rhona", "Rhonda", "Riane", "Riannon", "Rianon", "Rica", "Ricca", "Rici", "Ricki", "Rickie", "Ricky", "Riki", "Rikki", "Rina", "Risa", "Rita", "Riva", "Rivalee", "Rivi", "Rivkah", "Rivy", "Roana", "Roanna", "Roanne", "Robbi", "Robbie", "Robbin", "Robby", "Robbyn", "Robena", "Robenia", "Roberta", "Robin", "Robina", "Robinet", "Robinett", "Robinetta", "Robinette", "Robinia", "Roby", "Robyn", "Roch", "Rochell", "Rochella", "Rochelle", "Rochette", "Roda", "Rodi", "Rodie", "Rodina", "Rois", "Romola", "Romona", "Romonda", "Romy", "Rona", "Ronalda", "Ronda", "Ronica", "Ronna", "Ronni", "Ronnica", "Ronnie", "Ronny", "Roobbie", "Rora", "Rori", "Rorie", "Rory", "Ros", "Rosa", "Rosabel", "Rosabella", "Rosabelle", "Rosaleen", "Rosalia", "Rosalie", "Rosalind", "Rosalinda", "Rosalinde", "Rosaline", "Rosalyn", "Rosalynd", "Rosamond", "Rosamund", "Rosana", "Rosanna", "Rosanne", "Rose", "Roseann", "Roseanna", "Roseanne", "Roselia", "Roselin", "Roseline", "Rosella", "Roselle", "Rosemaria", "Rosemarie", "Rosemary", "Rosemonde", "Rosene", "Rosetta", "Rosette", "Roshelle", "Rosie", "Rosina", "Rosita", "Roslyn", "Rosmunda", "Rosy", "Row", "Rowe", "Rowena", "Roxana", "Roxane", "Roxanna", "Roxanne", "Roxi", "Roxie", "Roxine", "Roxy", "Roz", "Rozalie", "Rozalin", "Rozamond", "Rozanna", "Rozanne", "Roze", "Rozele", "Rozella", "Rozelle", "Rozina", "Rubetta", "Rubi", "Rubia", "Rubie", "Rubina", "Ruby", "Ruperta", "Ruth", "Ruthann", "Ruthanne", "Ruthe", "Ruthi", "Ruthie", "Ruthy", "Ryann", "Rycca", "Saba", "Sabina", "Sabine", "Sabra", "Sabrina", "Sacha", "Sada", "Sadella", "Sadie", "Sadye", "Saidee", "Sal", "Salaidh", "Sallee", "Salli", "Sallie", "Sally", "Sallyann", "Sallyanne", "Saloma", "Salome", "Salomi", "Sam", "Samantha", "Samara", "Samaria", "Sammy", "Sande", "Sandi", "Sandie", "Sandra", "Sandy", "Sandye", "Sapphira", "Sapphire", "Sara", "Sara-ann", "Saraann", "Sarah", "Sarajane", "Saree", "Sarena", "Sarene", "Sarette", "Sari", "Sarina", "Sarine", "Sarita", "Sascha", "Sasha", "Sashenka", "Saudra", "Saundra", "Savina", "Sayre", "Scarlet", "Scarlett", "Sean", "Seana", "Seka", "Sela", "Selena", "Selene", "Selestina", "Selia", "Selie", "Selina", "Selinda", "Seline", "Sella", "Selle", "Selma", "Sena", "Sephira", "Serena", "Serene", "Shae", "Shaina", "Shaine", "Shalna", "Shalne", "Shana", "Shanda", "Shandee", "Shandeigh", "Shandie", "Shandra", "Shandy", "Shane", "Shani", "Shanie", "Shanna", "Shannah", "Shannen", "Shannon", "Shanon", "Shanta", "Shantee", "Shara", "Sharai", "Shari", "Sharia", "Sharity", "Sharl", "Sharla", "Sharleen", "Sharlene", "Sharline", "Sharon", "Sharona", "Sharron", "Sharyl", "Shaun", "Shauna", "Shawn", "Shawna", "Shawnee", "Shay", "Shayla", "Shaylah", "Shaylyn", "Shaylynn", "Shayna", "Shayne", "Shea", "Sheba", "Sheela", "Sheelagh", "Sheelah", "Sheena", "Sheeree", "Sheila", "Sheila-kathryn", "Sheilah", "Shel", "Shela", "Shelagh", "Shelba", "Shelbi", "Shelby", "Shelia", "Shell", "Shelley", "Shelli", "Shellie", "Shelly", "Shena", "Sher", "Sheree", "Sheri", "Sherie", "Sherill", "Sherilyn", "Sherline", "Sherri", "Sherrie", "Sherry", "Sherye", "Sheryl", "Shina", "Shir", "Shirl", "Shirlee", "Shirleen", "Shirlene", "Shirley", "Shirline", "Shoshana", "Shoshanna", "Siana", "Sianna", "Sib", "Sibbie", "Sibby", "Sibeal", "Sibel", "Sibella", "Sibelle", "Sibilla", "Sibley", "Sibyl", "Sibylla", "Sibylle", "Sidoney", "Sidonia", "Sidonnie", "Sigrid", "Sile", "Sileas", "Silva", "Silvana", "Silvia", "Silvie", "Simona", "Simone", "Simonette", "Simonne", "Sindee", "Siobhan", "Sioux", "Siouxie", "Sisely", "Sisile", "Sissie", "Sissy", "Siusan", "Sofia", "Sofie", "Sondra", "Sonia", "Sonja", "Sonni", "Sonnie", "Sonnnie", "Sonny", "Sonya", "Sophey", "Sophi", "Sophia", "Sophie", "Sophronia", "Sorcha", "Sosanna", "Stace", "Stacee", "Stacey", "Staci", "Stacia", "Stacie", "Stacy", "Stafani", "Star", "Starla", "Starlene", "Starlin", "Starr", "Stefa", "Stefania", "Stefanie", "Steffane", "Steffi", "Steffie", "Stella", "Stepha", "Stephana", "Stephani", "Stephanie", "Stephannie", "Stephenie", "Stephi", "Stephie", "Stephine", "Stesha", "Stevana", "Stevena", "Stoddard", "Storm", "Stormi", "Stormie", "Stormy", "Sue", "Suellen", "Sukey", "Suki", "Sula", "Sunny", "Sunshine", "Susan", "Susana", "Susanetta", "Susann", "Susanna", "Susannah", "Susanne", "Susette", "Susi", "Susie", "Susy", "Suzann", "Suzanna", "Suzanne", "Suzette", "Suzi", "Suzie", "Suzy", "Sybil", "Sybila", "Sybilla", "Sybille", "Sybyl", "Sydel", "Sydelle", "Sydney", "Sylvia", "Tabatha", "Tabbatha", "Tabbi", "Tabbie", "Tabbitha", "Tabby", "Tabina", "Tabitha", "Taffy", "Talia", "Tallia", "Tallie", "Tallou", "Tallulah", "Tally", "Talya", "Talyah", "Tamar", "Tamara", "Tamarah", "Tamarra", "Tamera", "Tami", "Tamiko", "Tamma", "Tammara", "Tammi", "Tammie", "Tammy", "Tamqrah", "Tamra", "Tana", "Tandi", "Tandie", "Tandy", "Tanhya", "Tani", "Tania", "Tanitansy", "Tansy", "Tanya", "Tara", "Tarah", "Tarra", "Tarrah", "Taryn", "Tasha", "Tasia", "Tate", "Tatiana", "Tatiania", "Tatum", "Tawnya", "Tawsha", "Ted", "Tedda", "Teddi", "Teddie", "Teddy", "Tedi", "Tedra", "Teena", "Teirtza", "Teodora", "Tera", "Teresa", "Terese", "Teresina", "Teresita", "Teressa", "Teri", "Teriann", "Terra", "Terri", "Terrie", "Terrijo", "Terry", "Terrye", "Tersina", "Terza", "Tess", "Tessa", "Tessi", "Tessie", "Tessy", "Thalia", "Thea", "Theadora", "Theda", "Thekla", "Thelma", "Theo", "Theodora", "Theodosia", "Theresa", "Therese", "Theresina", "Theresita", "Theressa", "Therine", "Thia", "Thomasa", "Thomasin", "Thomasina", "Thomasine", "Tiena", "Tierney", "Tiertza", "Tiff", "Tiffani", "Tiffanie", "Tiffany", "Tiffi", "Tiffie", "Tiffy", "Tilda", "Tildi", "Tildie", "Tildy", "Tillie", "Tilly", "Tim", "Timi", "Timmi", "Timmie", "Timmy", "Timothea", "Tina", "Tine", "Tiphani", "Tiphanie", "Tiphany", "Tish", "Tisha", "Tobe", "Tobey", "Tobi", "Toby", "Tobye", "Toinette", "Toma", "Tomasina", "Tomasine", "Tomi", "Tommi", "Tommie", "Tommy", "Toni", "Tonia", "Tonie", "Tony", "Tonya", "Tonye", "Tootsie", "Torey", "Tori", "Torie", "Torrie", "Tory", "Tova", "Tove", "Tracee", "Tracey", "Traci", "Tracie", "Tracy", "Trenna", "Tresa", "Trescha", "Tressa", "Tricia", "Trina", "Trish", "Trisha", "Trista", "Trix", "Trixi", "Trixie", "Trixy", "Truda", "Trude", "Trudey", "Trudi", "Trudie", "Trudy", "Trula", "Tuesday", "Twila", "Twyla", "Tybi", "Tybie", "Tyne", "Ula", "Ulla", "Ulrica", "Ulrika", "Ulrikaumeko", "Ulrike", "Umeko", "Una", "Ursa", "Ursala", "Ursola", "Ursula", "Ursulina", "Ursuline", "Uta", "Val", "Valaree", "Valaria", "Vale", "Valeda", "Valencia", "Valene", "Valenka", "Valentia", "Valentina", "Valentine", "Valera", "Valeria", "Valerie", "Valery", "Valerye", "Valida", "Valina", "Valli", "Vallie", "Vally", "Valma", "Valry", "Van", "Vanda", "Vanessa", "Vania", "Vanna", "Vanni", "Vannie", "Vanny", "Vanya", "Veda", "Velma", "Velvet", "Venita", "Venus", "Vera", "Veradis", "Vere", "Verena", "Verene", "Veriee", "Verile", "Verina", "Verine", "Verla", "Verna", "Vernice", "Veronica", "Veronika", "Veronike", "Veronique", "Vevay", "Vi", "Vicki", "Vickie", "Vicky", "Victoria", "Vida", "Viki", "Vikki", "Vikky", "Vilhelmina", "Vilma", "Vin", "Vina", "Vinita", "Vinni", "Vinnie", "Vinny", "Viola", "Violante", "Viole", "Violet", "Violetta", "Violette", "Virgie", "Virgina", "Virginia", "Virginie", "Vita", "Vitia", "Vitoria", "Vittoria", "Viv", "Viva", "Vivi", "Vivia", "Vivian", "Viviana", "Vivianna", "Vivianne", "Vivie", "Vivien", "Viviene", "Vivienne", "Viviyan", "Vivyan", "Vivyanne", "Vonni", "Vonnie", "Vonny", "Vyky", "Wallie", "Wallis", "Walliw", "Wally", "Waly", "Wanda", "Wandie", "Wandis", "Waneta", "Wanids", "Wenda", "Wendeline", "Wendi", "Wendie", "Wendy", "Wendye", "Wenona", "Wenonah", "Whitney", "Wileen", "Wilhelmina", "Wilhelmine", "Wilie", "Willa", "Willabella", "Willamina", "Willetta", "Willette", "Willi", "Willie", "Willow", "Willy", "Willyt", "Wilma", "Wilmette", "Wilona", "Wilone", "Wilow", "Windy", "Wini", "Winifred", "Winna", "Winnah", "Winne", "Winni", "Winnie", "Winnifred", "Winny", "Winona", "Winonah", "Wren", "Wrennie", "Wylma", "Wynn", "Wynne", "Wynnie", "Wynny", "Xaviera", "Xena", "Xenia", "Xylia", "Xylina", "Yalonda", "Yasmeen", "Yasmin", "Yelena", "Yetta", "Yettie", "Yetty", "Yevette", "Ynes", "Ynez", "Yoko", "Yolanda", "Yolande", "Yolane", "Yolanthe", "Yoshi", "Yoshiko", "Yovonnda", "Ysabel", "Yvette", "Yvonne", "Zabrina", "Zahara", "Zandra", "Zaneta", "Zara", "Zarah", "Zaria", "Zarla", "Zea", "Zelda", "Zelma", "Zena", "Zenia", "Zia", "Zilvia", "Zita", "Zitella", "Zoe", "Zola", "Zonda", "Zondra", "Zonnya", "Zora", "Zorah", "Zorana", "Zorina", "Zorine", "Zsazsa", "Zulema", "Zuzana"], exports.starWars = ["Ackbar", "Adi Gallia", "Anakin Skywalker", "Arvel Crynyd", "Ayla Secura", "Bail Prestor Organa", "Barriss Offee", "Ben Quadinaros", "Beru Whitesun lars", "Bib Fortuna", "Biggs Darklighter", "Boba Fett", "Bossk", "C-3PO", "Chewbacca", "Cliegg Lars", "Cord\xE9", "Darth Maul", "Darth Vader", "Dexter Jettster", "Dooku", "Dorm\xE9", "Dud Bolt", "Eeth Koth", "Finis Valorum", "Gasgano", "Greedo", "Gregar Typho", "Grievous", "Han Solo", "IG-88", "Jabba Desilijic Tiure", "Jango Fett", "Jar Jar Binks", "Jek Tono Porkins", "Jocasta Nu", "Ki-Adi-Mundi", "Kit Fisto", "Lama Su", "Lando Calrissian", "Leia Organa", "Lobot", "Luke Skywalker", "Luminara Unduli", "Mace Windu", "Mas Amedda", "Mon Mothma", "Nien Nunb", "Nute Gunray", "Obi-Wan Kenobi", "Owen Lars", "Padm\xE9 Amidala", "Palpatine", "Plo Koon", "Poggle the Lesser", "Quarsh Panaka", "Qui-Gon Jinn", "R2-D2", "R4-P17", "R5-D4", "Ratts Tyerel", "Raymus Antilles", "Ric Oli\xE9", "Roos Tarpals", "Rugor Nass", "Saesee Tiin", "San Hill", "Sebulba", "Shaak Ti", "Shmi Skywalker", "Sly Moore", "Tarfful", "Taun We", "Tion Medon", "Wat Tambor", "Watto", "Wedge Antilles", "Wicket Systri Warrick", "Wilhuff Tarkin", "Yarael Poof", "Yoda", "Zam Wesell"], exports.uniqueNamesGenerator = (a2) => {
      const n = [...a2 && a2.dictionaries || i.dictionaries], l = { ...i, ...a2, length: a2 && a2.length || n.length, dictionaries: n };
      if (!a2 || !a2.dictionaries || !a2.dictionaries.length) throw new Error('A "dictionaries" array must be provided. This is a breaking change introduced starting from Unique Name Generator v4. Read more about the breaking change here: https://github.com/andreasonny83/unique-names-generator#migration-guide');
      return new e(l).generate();
    };
  }
});

// background-agents.ts
var import_unique_names_generator = __toESM(require_dist());
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path2 from "node:path";
import { tool } from "@opencode-ai/plugin";

// kdco-primitives/get-project-id.ts
import * as crypto from "node:crypto";
import { stat } from "node:fs/promises";
import * as path from "node:path";

// kdco-primitives/log-warn.ts
function logWarn(client, service, message) {
  if (!client) {
    console.warn(`[${service}] ${message}`);
    return;
  }
  client.app.log({
    body: { service, level: "warn", message }
  }).catch(() => {
  });
}

// kdco-primitives/with-timeout.ts
var TimeoutError = class extends Error {
  name = "TimeoutError";
  timeoutMs;
  constructor(message, timeoutMs) {
    super(message);
    this.timeoutMs = timeoutMs;
  }
};
async function withTimeout(promise, ms, message = "Operation timed out") {
  if (typeof ms !== "number" || ms < 0) {
    throw new Error(`withTimeout: timeout must be a non-negative number, got ${ms}`);
  }
  if (ms === 0) {
    throw new TimeoutError(message, ms);
  }
  let timeoutId;
  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new TimeoutError(message, ms));
      }, ms);
    })
  ]);
}

// kdco-primitives/get-project-id.ts
function hashPath(projectRoot) {
  const hash = crypto.createHash("sha256").update(projectRoot).digest("hex");
  return hash.slice(0, 16);
}
async function getProjectId(projectRoot, client) {
  if (!projectRoot || typeof projectRoot !== "string") {
    throw new Error("getProjectId: projectRoot is required and must be a string");
  }
  const gitPath = path.join(projectRoot, ".git");
  const gitStat = await stat(gitPath).catch(() => null);
  if (!gitStat) {
    logWarn(client, "project-id", `No .git found at ${projectRoot}, using path hash`);
    return hashPath(projectRoot);
  }
  let gitDir = gitPath;
  if (gitStat.isFile()) {
    const content = await Bun.file(gitPath).text();
    const match = content.match(/^gitdir:\s*(.+)$/m);
    if (!match) {
      throw new Error(`getProjectId: .git file exists but has invalid format at ${gitPath}`);
    }
    const gitdirPath = match[1].trim();
    const resolvedGitdir = path.resolve(projectRoot, gitdirPath);
    const commondirPath = path.join(resolvedGitdir, "commondir");
    const commondirFile = Bun.file(commondirPath);
    if (await commondirFile.exists()) {
      const commondirContent = (await commondirFile.text()).trim();
      gitDir = path.resolve(resolvedGitdir, commondirContent);
    } else {
      gitDir = path.resolve(resolvedGitdir, "../..");
    }
    const gitDirStat = await stat(gitDir).catch(() => null);
    if (!gitDirStat?.isDirectory()) {
      throw new Error(`getProjectId: Resolved gitdir ${gitDir} is not a directory`);
    }
  }
  const cacheFile = path.join(gitDir, "opencode");
  const cache = Bun.file(cacheFile);
  if (await cache.exists()) {
    const cached = (await cache.text()).trim();
    if (/^[a-f0-9]{40}$/i.test(cached) || /^[a-f0-9]{16}$/i.test(cached)) {
      return cached;
    }
    logWarn(client, "project-id", `Invalid cache content at ${cacheFile}, regenerating`);
  }
  try {
    const proc = Bun.spawn(["git", "rev-list", "--max-parents=0", "--all"], {
      cwd: projectRoot,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, GIT_DIR: void 0, GIT_WORK_TREE: void 0 }
    });
    const timeoutMs = 5e3;
    const exitCode = await withTimeout(proc.exited, timeoutMs, `git rev-list timed out`).catch(
      (e) => {
        if (e instanceof TimeoutError) {
          proc.kill();
        }
        return 1;
      }
    );
    if (exitCode === 0) {
      const output = await new Response(proc.stdout).text();
      const roots = output.split("\n").filter(Boolean).map((x) => x.trim()).sort();
      if (roots.length > 0 && /^[a-f0-9]{40}$/i.test(roots[0])) {
        const projectId = roots[0];
        try {
          await Bun.write(cacheFile, projectId);
        } catch (e) {
          logWarn(client, "project-id", `Failed to cache project ID: ${e}`);
        }
        return projectId;
      }
    } else {
      const stderr = await new Response(proc.stderr).text();
      logWarn(client, "project-id", `git rev-list failed (${exitCode}): ${stderr.trim()}`);
    }
  } catch (error) {
    logWarn(client, "project-id", `git command failed: ${error}`);
  }
  return hashPath(projectRoot);
}

// background-agents.ts
function generateReadableId() {
  return (0, import_unique_names_generator.uniqueNamesGenerator)({
    dictionaries: [import_unique_names_generator.adjectives, import_unique_names_generator.colors, import_unique_names_generator.animals],
    separator: "-",
    length: 3,
    style: "lowerCase"
  });
}
async function generateMetadata(client, resultContent, parentID, debugLog) {
  const fallbackMetadata = () => {
    const firstLine = resultContent.split("\n").find((l) => l.trim().length > 0) || "Delegation result";
    const title = firstLine.slice(0, 30).trim() + (firstLine.length > 30 ? "..." : "");
    const description = resultContent.slice(0, 150).trim() + (resultContent.length > 150 ? "..." : "");
    return { title, description };
  };
  try {
    const config = await client.config.get();
    const configData = config.data;
    if (!configData?.small_model) {
      await debugLog("generateMetadata: No small_model configured, using fallback");
      return fallbackMetadata();
    }
    await debugLog(`generateMetadata: Using small_model ${configData.small_model}`);
    const session = await client.session.create({
      body: {
        title: "Metadata Generation",
        parentID
      }
    });
    if (!session.data?.id) {
      await debugLog("generateMetadata: Failed to create session");
      return fallbackMetadata();
    }
    const prompt = `Generate a title and description for this research result.

RULES:
- Title: 2-5 words, max 30 characters, sentence case
- Description: 2-3 sentences, max 150 characters, summarize key findings

RESULT CONTENT:
${resultContent.slice(0, 2e3)}

Respond with ONLY valid JSON in this exact format:
{"title": "Your Title Here", "description": "Your description here."}`;
    const PROMPT_TIMEOUT_MS = 3e4;
    const result = await Promise.race([
      client.session.prompt({
        path: { id: session.data.id },
        body: {
          parts: [{ type: "text", text: prompt }]
        }
      }),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Prompt timeout after 30s")), PROMPT_TIMEOUT_MS)
      )
    ]);
    const responseParts = result.data?.parts;
    const textPart = responseParts?.find((p) => p.type === "text");
    if (!textPart) {
      await debugLog("generateMetadata: No text part in response");
      return fallbackMetadata();
    }
    const jsonMatch = textPart.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await debugLog(`generateMetadata: No JSON found in response: ${textPart.text}`);
      return fallbackMetadata();
    }
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.title || !parsed.description) {
      await debugLog("generateMetadata: Invalid JSON structure");
      return fallbackMetadata();
    }
    await debugLog(`generateMetadata: Generated title="${parsed.title}"`);
    return {
      title: parsed.title.slice(0, 30),
      description: parsed.description.slice(0, 150)
    };
  } catch (error) {
    await debugLog(
      `generateMetadata error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return fallbackMetadata();
  }
}
var DEFAULT_MAX_RUN_TIME_MS = 15 * 60 * 1e3;
var TERMINAL_WAIT_GRACE_MS = 1e4;
var READ_POLL_INTERVAL_MS = 250;
var ALL_COMPLETE_QUIET_PERIOD_MS = 50;
var PARENT_NOTIFICATION_TIMEOUT_MS = 5e3;
function createLogger(client) {
  const log = (level, message) => client.app.log({ body: { service: "background-agents", level, message } }).catch(() => {
  });
  return {
    debug: (msg) => log("debug", msg),
    info: (msg) => log("info", msg),
    warn: (msg) => log("warn", msg),
    error: (msg) => log("error", msg)
  };
}
async function parseAgentMode(client, agentName, log) {
  try {
    const result = await client.app.agents({});
    const agents = result.data ?? [];
    const agent = agents.find((a) => a.name === agentName);
    return { isSubAgent: agent?.mode === "subagent" };
  } catch (error) {
    log.warn(
      `Agent list fetch failed for "${agentName}", assuming non-sub-agent: ${error instanceof Error ? error.message : String(error)}`
    );
    return { isSubAgent: false };
  }
}
function isPermissionDenied(entry) {
  if (entry === void 0) return false;
  if (entry === "deny") return true;
  if (typeof entry === "object" && entry["*"] === "deny") return true;
  return false;
}
async function parseAgentWriteCapability(client, agentName, log) {
  try {
    const config = await client.config.get();
    const configData = config.data;
    const permission = configData?.agent?.[agentName]?.permission ?? {};
    const editDenied = isPermissionDenied(permission.edit);
    const writeDenied = isPermissionDenied(permission.write);
    const bashDenied = isPermissionDenied(permission.bash);
    return { isReadOnly: editDenied && writeDenied && bashDenied };
  } catch (error) {
    log.warn(
      `Config fetch failed for "${agentName}", assuming write-capable: ${error instanceof Error ? error.message : String(error)}`
    );
    return { isReadOnly: false };
  }
}
function isTerminalStatus(status) {
  return status === "complete" || status === "error" || status === "cancelled" || status === "timeout";
}
function isActiveStatus(status) {
  return status === "registered" || status === "running";
}
function normalizeId(value) {
  return value.trim();
}
function parsePersistedStatus(raw) {
  if (!raw) return "complete";
  if (raw === "registered") return "registered";
  if (raw === "running") return "running";
  if (raw === "complete") return "complete";
  if (raw === "error") return "error";
  if (raw === "cancelled") return "cancelled";
  if (raw === "timeout") return "timeout";
  return "complete";
}
var DelegationManager = class {
  delegations = /* @__PURE__ */ new Map();
  delegationsBySession = /* @__PURE__ */ new Map();
  terminalWaiters = /* @__PURE__ */ new Map();
  timeoutTimers = /* @__PURE__ */ new Map();
  client;
  baseDir;
  log;
  maxRunTimeMs;
  readPollIntervalMs;
  terminalWaitGraceMs;
  allCompleteQuietPeriodMs;
  idGenerator;
  metadataGenerator;
  pendingByParent = /* @__PURE__ */ new Map();
  parentNotificationState = /* @__PURE__ */ new Map();
  pendingNotifications = /* @__PURE__ */ new Map();
  constructor(client, baseDir, log, options = {}) {
    this.client = client;
    this.baseDir = baseDir;
    this.log = log;
    this.maxRunTimeMs = options.maxRunTimeMs ?? DEFAULT_MAX_RUN_TIME_MS;
    this.readPollIntervalMs = options.readPollIntervalMs ?? READ_POLL_INTERVAL_MS;
    this.terminalWaitGraceMs = options.terminalWaitGraceMs ?? TERMINAL_WAIT_GRACE_MS;
    this.allCompleteQuietPeriodMs = options.allCompleteQuietPeriodMs ?? ALL_COMPLETE_QUIET_PERIOD_MS;
    this.idGenerator = options.idGenerator ?? generateReadableId;
    this.metadataGenerator = options.metadataGenerator ?? generateMetadata;
  }
  /**
   * Resolves the root session ID by walking up the parent chain.
   */
  async getRootSessionID(sessionID) {
    let currentID = sessionID;
    for (let depth = 0; depth < 10; depth++) {
      try {
        const session = await this.client.session.get({
          path: { id: currentID }
        });
        if (!session.data?.parentID) {
          return currentID;
        }
        currentID = session.data.parentID;
      } catch {
        return currentID;
      }
    }
    return currentID;
  }
  /**
   * Get the delegations directory for a session scope (root session)
   */
  async getDelegationsDir(sessionID) {
    const rootID = await this.getRootSessionID(sessionID);
    return path2.join(this.baseDir, rootID);
  }
  /**
   * Ensure the delegations directory exists
   */
  async ensureDelegationsDir(sessionID) {
    const dir = await this.getDelegationsDir(sessionID);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }
  createTerminalWaiter(id) {
    if (this.terminalWaiters.has(id)) return;
    let resolve2;
    const promise = new Promise((innerResolve) => {
      resolve2 = innerResolve;
    });
    if (!resolve2) {
      throw new Error(`Failed to initialize terminal waiter for delegation ${id}`);
    }
    this.terminalWaiters.set(id, { promise, resolve: resolve2 });
  }
  resolveTerminalWaiter(id) {
    const waiter = this.terminalWaiters.get(id);
    if (!waiter) return;
    waiter.resolve();
  }
  clearTimeoutTimer(id) {
    const timer = this.timeoutTimers.get(id);
    if (!timer) return;
    clearTimeout(timer);
    this.timeoutTimers.delete(id);
  }
  scheduleTimeout(id) {
    this.clearTimeoutTimer(id);
    const timer = setTimeout(() => {
      void this.handleTimeout(id);
    }, this.maxRunTimeMs + 5e3);
    this.timeoutTimers.set(id, timer);
  }
  updateDelegation(id, mutate) {
    const delegation = this.delegations.get(id);
    if (!delegation) return void 0;
    const now = /* @__PURE__ */ new Date();
    mutate(delegation, now);
    delegation.updatedAt = now;
    return delegation;
  }
  registerDelegation(input) {
    if (!this.pendingByParent.has(input.parentSessionID)) {
      this.pendingByParent.set(input.parentSessionID, /* @__PURE__ */ new Set());
      this.resetParentAllCompleteNotificationCycle(input.parentSessionID);
    }
    const parentNotificationState = this.getParentNotificationState(input.parentSessionID);
    const notificationCycle = parentNotificationState.allCompleteCycle;
    const notificationCycleToken = parentNotificationState.allCompleteCycleToken;
    const now = /* @__PURE__ */ new Date();
    const delegation = {
      id: input.id,
      rootSessionID: input.rootSessionID,
      sessionID: input.sessionID,
      parentSessionID: input.parentSessionID,
      parentMessageID: input.parentMessageID,
      parentAgent: input.parentAgent,
      prompt: input.prompt,
      agent: input.agent,
      notificationCycle,
      notificationCycleToken,
      status: "registered",
      createdAt: now,
      updatedAt: now,
      timeoutAt: new Date(now.getTime() + this.maxRunTimeMs),
      progress: {
        toolCalls: 0,
        lastUpdateAt: now,
        lastHeartbeatAt: now
      },
      notification: {
        terminalNotificationCount: 0
      },
      retrieval: {
        retrievalCount: 0
      },
      artifact: {
        filePath: input.artifactPath
      }
    };
    this.delegations.set(delegation.id, delegation);
    this.delegationsBySession.set(delegation.sessionID, delegation.id);
    this.createTerminalWaiter(delegation.id);
    this.pendingByParent.get(delegation.parentSessionID)?.add(delegation.id);
    return delegation;
  }
  markStarted(id) {
    return this.updateDelegation(id, (delegation, now) => {
      if (isTerminalStatus(delegation.status)) return;
      delegation.status = "running";
      delegation.startedAt = now;
      delegation.progress.lastUpdateAt = now;
      delegation.progress.lastHeartbeatAt = now;
    });
  }
  markProgress(id, messageText) {
    return this.updateDelegation(id, (delegation, now) => {
      if (isTerminalStatus(delegation.status)) return;
      if (delegation.status === "registered") {
        delegation.status = "running";
        delegation.startedAt = delegation.startedAt ?? now;
      }
      delegation.progress.lastUpdateAt = now;
      delegation.progress.lastHeartbeatAt = now;
      if (messageText) {
        delegation.progress.lastMessage = messageText;
        delegation.progress.lastMessageAt = now;
      }
    });
  }
  markTerminal(id, status, error) {
    const delegation = this.delegations.get(id);
    if (!delegation) return { transitioned: false };
    if (isTerminalStatus(delegation.status)) {
      return { transitioned: false, delegation };
    }
    const now = /* @__PURE__ */ new Date();
    delegation.status = status;
    delegation.completedAt = now;
    delegation.updatedAt = now;
    if (error) {
      delegation.error = error;
    }
    const pending = this.pendingByParent.get(delegation.parentSessionID);
    if (pending) {
      pending.delete(delegation.id);
      if (pending.size === 0) {
        this.pendingByParent.delete(delegation.parentSessionID);
      }
    }
    this.clearTimeoutTimer(id);
    this.resolveTerminalWaiter(id);
    return { transitioned: true, delegation };
  }
  markNotified(id) {
    return this.updateDelegation(id, (delegation, now) => {
      delegation.notification.terminalNotifiedAt = now;
      delegation.notification.terminalNotificationCount += 1;
    });
  }
  getParentNotificationState(parentSessionID) {
    const existing = this.parentNotificationState.get(parentSessionID);
    if (existing) return existing;
    const initialized = {
      allCompleteNotificationCount: 0,
      allCompleteCycle: 0,
      allCompleteCycleToken: this.buildAllCompleteCycleToken(parentSessionID, 0)
    };
    this.parentNotificationState.set(parentSessionID, initialized);
    return initialized;
  }
  buildAllCompleteCycleToken(parentSessionID, cycle) {
    return `${parentSessionID}:${cycle}`;
  }
  resetParentAllCompleteNotificationCycle(parentSessionID) {
    const state = this.getParentNotificationState(parentSessionID);
    this.cancelScheduledAllComplete(state);
    state.allCompleteCycle += 1;
    state.allCompleteCycleToken = this.buildAllCompleteCycleToken(
      parentSessionID,
      state.allCompleteCycle
    );
    state.allCompleteNotifiedAt = void 0;
    state.allCompleteNotifiedCycle = void 0;
    state.allCompleteNotifiedCycleToken = void 0;
  }
  cancelScheduledAllComplete(state) {
    if (state.allCompleteScheduledTimer) {
      clearTimeout(state.allCompleteScheduledTimer);
    }
    state.allCompleteScheduledTimer = void 0;
    state.allCompleteScheduledCycle = void 0;
    state.allCompleteScheduledCycleToken = void 0;
  }
  areCycleTerminalNotificationsComplete(parentSessionID, cycleToken) {
    let cycleDelegationCount = 0;
    for (const delegation of this.delegations.values()) {
      if (delegation.parentSessionID !== parentSessionID) continue;
      if (delegation.notificationCycleToken !== cycleToken) continue;
      cycleDelegationCount += 1;
      if (!delegation.notification.terminalNotifiedAt) {
        return false;
      }
    }
    return cycleDelegationCount > 0;
  }
  scheduleAllCompleteForParent(parentSessionID, parentAgent) {
    const state = this.getParentNotificationState(parentSessionID);
    const cycle = state.allCompleteCycle;
    const cycleToken = state.allCompleteCycleToken;
    if (!this.areCycleTerminalNotificationsComplete(parentSessionID, cycleToken)) return;
    if (state.allCompleteNotifiedCycleToken === cycleToken) return;
    if (state.allCompleteScheduledCycleToken === cycleToken) return;
    this.cancelScheduledAllComplete(state);
    state.allCompleteScheduledCycle = cycle;
    state.allCompleteScheduledCycleToken = cycleToken;
    state.allCompleteScheduledTimer = setTimeout(() => {
      void this.dispatchScheduledAllComplete(parentSessionID, parentAgent, cycle, cycleToken);
    }, this.allCompleteQuietPeriodMs);
  }
  async dispatchScheduledAllComplete(parentSessionID, parentAgent, cycle, cycleToken) {
    const state = this.getParentNotificationState(parentSessionID);
    if (state.allCompleteScheduledCycleToken !== cycleToken) return;
    this.cancelScheduledAllComplete(state);
    if (state.allCompleteCycleToken !== cycleToken) return;
    if (!this.areCycleTerminalNotificationsComplete(parentSessionID, cycleToken)) return;
    if (state.allCompleteNotifiedCycleToken === cycleToken) return;
    const deliveryStatus = await this.sendParentNotification(
      parentSessionID,
      parentAgent,
      this.buildAllCompleteNotification(parentSessionID, cycle, cycleToken),
      false
    );
    if (state.allCompleteCycleToken !== cycleToken) return;
    if (!this.areCycleTerminalNotificationsComplete(parentSessionID, cycleToken)) return;
    state.allCompleteNotifiedAt = /* @__PURE__ */ new Date();
    state.allCompleteNotificationCount += 1;
    state.allCompleteNotifiedCycle = cycle;
    state.allCompleteNotifiedCycleToken = cycleToken;
    await this.debugLog(
      `all-complete notification ${deliveryStatus} for ${parentSessionID} cycle=${cycleToken}`
    );
  }
  queuePendingNotification(parentSessionID, notification) {
    const pending = this.pendingNotifications.get(parentSessionID) ?? [];
    pending.push(notification);
    this.pendingNotifications.set(parentSessionID, pending);
  }
  async sendParentNotification(parentSessionID, parentAgent, notification, noReply) {
    const session = this.client.session;
    let timeout;
    try {
      await this.debugLog(
        `parent notification sending for ${parentSessionID} noReply=${noReply} async=${Boolean(
          session.promptAsync
        )}`
      );
      const result = await Promise.race([
        session.promptAsync({
          path: { id: parentSessionID },
          body: {
            noReply,
            agent: parentAgent,
            parts: [{ type: "text", text: notification }]
          }
        }).then(() => "sent"),
        new Promise((resolve2) => {
          timeout = setTimeout(() => resolve2("timed-out"), PARENT_NOTIFICATION_TIMEOUT_MS);
        })
      ]);
      if (result === "timed-out") {
        await this.debugLog(
          `parent notification timed out for ${parentSessionID} after ${PARENT_NOTIFICATION_TIMEOUT_MS}ms`
        );
      }
      return result;
    } catch (error) {
      this.queuePendingNotification(parentSessionID, notification);
      await this.debugLog(
        `parent notification queued for ${parentSessionID}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return "queued";
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
  injectPendingNotificationsIntoChatMessage(output, sessionID) {
    const pending = this.pendingNotifications.get(sessionID);
    if (!pending || pending.length === 0) return;
    this.pendingNotifications.delete(sessionID);
    const notificationText = pending.join("\n\n");
    const parts = output.parts ?? [];
    const firstTextPart = parts.find((part) => part.type === "text");
    if (firstTextPart) {
      firstTextPart.text = `${notificationText}

${firstTextPart.text ?? ""}`;
      output.parts = parts;
      return;
    }
    output.parts = [{ type: "text", text: notificationText }, ...parts];
  }
  markRetrieved(id, readerSessionID) {
    return this.updateDelegation(id, (delegation, now) => {
      delegation.retrieval.retrievedAt = now;
      delegation.retrieval.retrievalCount += 1;
      delegation.retrieval.lastReaderSessionID = readerSessionID;
    });
  }
  hasUnreadCompletion(delegation) {
    if (!isTerminalStatus(delegation.status)) return false;
    if (!delegation.notification.terminalNotifiedAt) return false;
    if (!delegation.completedAt) return false;
    if (!delegation.retrieval.retrievedAt) return true;
    return delegation.retrieval.retrievedAt.getTime() < delegation.completedAt.getTime();
  }
  async waitForTerminal(id, timeoutMs) {
    const delegation = this.delegations.get(id);
    if (!delegation) return "timeout";
    if (isTerminalStatus(delegation.status)) return "terminal";
    const waiter = this.terminalWaiters.get(id);
    if (!waiter) return "timeout";
    let timer;
    try {
      const result = await Promise.race([
        waiter.promise.then(() => "terminal"),
        new Promise((resolve2) => {
          timer = setTimeout(() => resolve2("timeout"), timeoutMs);
        })
      ]);
      return result;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  async generateUniqueDelegationId(artifactDir) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = this.idGenerator();
      if (this.delegations.has(candidate)) continue;
      const candidatePath = path2.join(artifactDir, `${candidate}.md`);
      try {
        await fs.access(candidatePath);
      } catch {
        return candidate;
      }
    }
    throw new Error("Failed to generate unique delegation ID after 20 attempts");
  }
  getDelegationBySession(sessionID) {
    const delegationId = this.delegationsBySession.get(sessionID);
    if (!delegationId) return void 0;
    return this.delegations.get(delegationId);
  }
  isVisibleToSession(delegation, rootSessionID) {
    return delegation.rootSessionID === rootSessionID;
  }
  buildTerminalNotification(delegation, remainingCount) {
    const lines = [
      "<task-notification>",
      `<task-id>${delegation.id}</task-id>`,
      `<status>${delegation.status}</status>`,
      `<summary>Background agent ${delegation.status}: ${delegation.title || delegation.id}</summary>`,
      delegation.title ? `<title>${delegation.title}</title>` : "",
      delegation.description ? `<description>${delegation.description}</description>` : "",
      delegation.error ? `<error>${delegation.error}</error>` : "",
      `<artifact>${delegation.artifact.filePath}</artifact>`,
      `<retrieval>Use delegation_read("${delegation.id}") for full output.</retrieval>`,
      remainingCount > 0 ? `<remaining>${remainingCount}</remaining>` : "",
      "</task-notification>"
    ];
    return lines.filter((line) => line.length > 0).join("\n");
  }
  buildAllCompleteNotification(parentSessionID, cycle, cycleToken) {
    return [
      "<task-notification>",
      "<type>all-complete</type>",
      "<status>completed</status>",
      "<summary>All delegations complete.</summary>",
      `<parent-session-id>${parentSessionID}</parent-session-id>`,
      `<cycle>${cycle}</cycle>`,
      `<cycle-token>${cycleToken}</cycle-token>`,
      "</task-notification>"
    ].join("\n");
  }
  buildDeterministicTerminalReadResponse(delegation) {
    const lines = [
      `Delegation ID: ${delegation.id}`,
      `Status: ${delegation.status}`,
      `Agent: ${delegation.agent}`,
      `Started: ${delegation.startedAt?.toISOString() || delegation.createdAt.toISOString()}`,
      `Completed: ${delegation.completedAt?.toISOString() || "N/A"}`,
      `Artifact: ${delegation.artifact.filePath}`
    ];
    if (delegation.title) lines.push(`Title: ${delegation.title}`);
    if (delegation.description) lines.push(`Description: ${delegation.description}`);
    if (delegation.error) lines.push(`Error: ${delegation.error}`);
    lines.push(`
Use delegation_read("${delegation.id}") again after persistence completes.`);
    return lines.join("\n");
  }
  async readPersistedArtifact(filePath) {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch {
      return null;
    }
  }
  async waitForPersistedArtifact(filePath, maxWaitMs) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const content = await this.readPersistedArtifact(filePath);
      if (content !== null) return content;
      await new Promise((resolve2) => setTimeout(resolve2, this.readPollIntervalMs));
    }
    return null;
  }
  async resolveDelegationResult(delegation) {
    if (delegation.status === "error") {
      return `Error: ${delegation.error || "Delegation failed."}`;
    }
    if (delegation.status === "cancelled") {
      return "Delegation was cancelled before completion.";
    }
    if (delegation.status === "timeout") {
      const partial = await this.getResult(delegation);
      return `${partial}

[TIMEOUT REACHED]`;
    }
    return await this.getResult(delegation);
  }
  async finalizeDelegation(delegationId, status, error) {
    const { transitioned, delegation } = this.markTerminal(delegationId, status, error);
    if (!transitioned || !delegation) return;
    await this.debugLog(`finalizeDelegation(${delegation.id}, ${status}) started`);
    const resolvedResult = await this.resolveDelegationResult(delegation);
    delegation.result = resolvedResult;
    if (resolvedResult.trim().length > 0) {
      const metadata = await this.metadataGenerator(
        this.client,
        resolvedResult,
        delegation.sessionID,
        (msg) => this.debugLog(msg)
      );
      delegation.title = metadata.title;
      delegation.description = metadata.description;
    }
    await this.persistOutput(delegation, resolvedResult);
    await this.notifyParent(delegation.id);
  }
  async notifyParent(delegationId) {
    try {
      const delegation = this.delegations.get(delegationId);
      if (!delegation) return;
      if (!isTerminalStatus(delegation.status)) return;
      if (delegation.notification.terminalNotifiedAt) {
        await this.debugLog(`notifyParent skipped for ${delegation.id}; already notified`);
        return;
      }
      const remainingCount = this.getPendingCount(delegation.parentSessionID);
      const terminalNotification = this.buildTerminalNotification(delegation, remainingCount);
      const deliveryStatus = await this.sendParentNotification(
        delegation.parentSessionID,
        delegation.parentAgent,
        terminalNotification,
        true
      );
      this.markNotified(delegation.id);
      this.scheduleAllCompleteForParent(delegation.parentSessionID, delegation.parentAgent);
      await this.debugLog(
        `notifyParent ${deliveryStatus} for ${delegation.id} (remaining=${remainingCount}, status=${delegation.status})`
      );
    } catch (error) {
      await this.debugLog(
        `notifyParent failed for ${delegationId}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  /**
   * Delegate a task to an agent
   */
  async delegate(input) {
    const agentsResult = await this.client.app.agents({});
    const agents = agentsResult.data ?? [];
    const validAgent = agents.find((a) => a.name === input.agent);
    if (!validAgent) {
      const available = agents.filter((a) => a.mode === "subagent" || a.mode === "all" || !a.mode).map((a) => `\u2022 ${a.name}${a.description ? ` - ${a.description}` : ""}`).join("\n");
      throw new Error(
        `Agent "${input.agent}" not found.

Available agents:
${available || "(none)"}`
      );
    }
    const { isReadOnly } = await parseAgentWriteCapability(this.client, input.agent, this.log);
    if (!isReadOnly) {
      throw new Error(
        `Agent "${input.agent}" is write-capable and requires the native \`task\` tool for proper undo/branching support.

Use \`task\` instead of \`delegate\` for write-capable agents.

Read-only sub-agents (edit/write/bash denied) use \`delegate\`.
Write-capable sub-agents (any write permission) use \`task\`.`
      );
    }
    const artifactDir = await this.ensureDelegationsDir(input.parentSessionID);
    const rootSessionID = await this.getRootSessionID(input.parentSessionID);
    const stableId = await this.generateUniqueDelegationId(artifactDir);
    const artifactPath = path2.join(artifactDir, `${stableId}.md`);
    await this.debugLog(`delegate() called, generated stable ID: ${stableId}`);
    const sessionResult = await this.client.session.create({
      body: {
        title: `Delegation: ${stableId}`,
        parentID: input.parentSessionID
      }
    });
    await this.debugLog(`session.create result: ${JSON.stringify(sessionResult.data)}`);
    if (!sessionResult.data?.id) {
      throw new Error("Failed to create delegation session");
    }
    const delegation = this.registerDelegation({
      id: stableId,
      rootSessionID,
      sessionID: sessionResult.data.id,
      parentSessionID: input.parentSessionID,
      parentMessageID: input.parentMessageID,
      parentAgent: input.parentAgent,
      prompt: input.prompt,
      agent: input.agent,
      artifactPath
    });
    await this.debugLog(`Registered delegation ${delegation.id} before execution`);
    this.scheduleTimeout(delegation.id);
    this.markStarted(delegation.id);
    this.client.session.prompt({
      path: { id: delegation.sessionID },
      body: {
        agent: input.agent,
        parts: [{ type: "text", text: input.prompt }],
        tools: {
          task: false,
          delegate: false,
          todowrite: false,
          plan_save: false
        }
      }
    }).then(() => {
      void this.finalizeDelegation(delegation.id, "complete");
    }).catch((error) => {
      void this.finalizeDelegation(delegation.id, "error", error.message);
    });
    return delegation;
  }
  /**
   * Handle delegation timeout
   */
  async handleTimeout(delegationId) {
    const delegation = this.delegations.get(delegationId);
    if (!delegation || isTerminalStatus(delegation.status)) return;
    await this.debugLog(`handleTimeout for delegation ${delegation.id}`);
    try {
      await this.client.session.delete({
        path: { id: delegation.sessionID }
      });
    } catch {
    }
    await this.finalizeDelegation(
      delegation.id,
      "timeout",
      `Delegation timed out after ${this.maxRunTimeMs / 1e3}s`
    );
  }
  /**
   * Handle session.idle event - called when a session becomes idle
   */
  async handleSessionIdle(sessionID) {
    const delegation = this.findBySession(sessionID);
    if (!delegation || isTerminalStatus(delegation.status)) return;
    await this.debugLog(`handleSessionIdle for delegation ${delegation.id}`);
    await this.finalizeDelegation(delegation.id, "complete");
  }
  /**
   * Get the result from a delegation's session
   */
  async getResult(delegation) {
    try {
      const messages = await this.client.session.messages({
        path: { id: delegation.sessionID }
      });
      const messageData = messages.data;
      if (!messageData || messageData.length === 0) {
        await this.debugLog(`getResult: No messages found for session ${delegation.sessionID}`);
        return `Delegation "${delegation.description}" completed but produced no output.`;
      }
      await this.debugLog(
        `getResult: Found ${messageData.length} messages. Roles: ${messageData.map((m) => m.info.role).join(", ")}`
      );
      const isAssistantMessage = (m) => m.info.role === "assistant";
      const assistantMessages = messageData.filter(isAssistantMessage);
      if (assistantMessages.length === 0) {
        await this.debugLog(
          `getResult: No assistant messages found in ${JSON.stringify(messageData.map((m) => ({ role: m.info.role, keys: Object.keys(m) })))}`
        );
        return `Delegation "${delegation.description}" completed but produced no assistant response.`;
      }
      const lastMessage = assistantMessages[assistantMessages.length - 1];
      const isTextPart = (p) => p.type === "text";
      const textParts = lastMessage.parts.filter(isTextPart);
      if (textParts.length === 0) {
        await this.debugLog(
          `getResult: No text parts found in message: ${JSON.stringify(lastMessage)}`
        );
        return `Delegation "${delegation.description}" completed but produced no text content.`;
      }
      return textParts.map((p) => p.text).join("\n");
    } catch (error) {
      await this.debugLog(
        `getResult error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return `Delegation "${delegation.description}" completed but result could not be retrieved: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }
  /**
   * Persist delegation output to storage
   */
  async persistOutput(delegation, content) {
    try {
      const title = delegation.title || delegation.id;
      const description = delegation.description || "(No description generated)";
      const header = `# ${title}

${description}

**ID:** ${delegation.id}
**Agent:** ${delegation.agent}
**Status:** ${delegation.status}
**Session:** ${delegation.sessionID}
**Started:** ${(delegation.startedAt || delegation.createdAt).toISOString()}
**Completed:** ${delegation.completedAt?.toISOString() || "N/A"}

---

`;
      await fs.writeFile(delegation.artifact.filePath, header + content, "utf8");
      const stats = await fs.stat(delegation.artifact.filePath);
      this.updateDelegation(delegation.id, (record, now) => {
        record.artifact.persistedAt = now;
        record.artifact.byteLength = stats.size;
        record.artifact.persistError = void 0;
      });
      await this.debugLog(`Persisted output to ${delegation.artifact.filePath}`);
    } catch (error) {
      this.updateDelegation(delegation.id, (record) => {
        record.artifact.persistError = error instanceof Error ? error.message : "Unknown persistence error";
      });
      await this.debugLog(
        `Failed to persist output: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  /**
   * Read a delegation's output by ID. Blocks if the delegation is still running.
   */
  async readOutput(sessionID, id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) {
      throw new Error("Delegation ID is required");
    }
    const rootSessionID = await this.getRootSessionID(sessionID);
    let delegation = this.delegations.get(normalizedId);
    if (delegation && !this.isVisibleToSession(delegation, rootSessionID)) {
      delegation = void 0;
    }
    const fallbackFilePath = path2.join(
      await this.getDelegationsDir(sessionID),
      `${normalizedId}.md`
    );
    const immediateArtifactPath = delegation?.artifact.filePath || fallbackFilePath;
    const immediateRead = await this.readPersistedArtifact(immediateArtifactPath);
    if (immediateRead !== null) {
      if (delegation) this.markRetrieved(delegation.id, sessionID);
      return immediateRead;
    }
    if (!delegation) {
      throw new Error(
        `Delegation "${normalizedId}" not found.

Use delegation_list() to see available delegations.`
      );
    }
    if (isActiveStatus(delegation.status)) {
      const remainingMs = Math.max(
        delegation.timeoutAt.getTime() - Date.now() + this.terminalWaitGraceMs,
        this.readPollIntervalMs
      );
      await this.debugLog(
        `readOutput: waiting up to ${remainingMs}ms for delegation ${delegation.id} to reach terminal state`
      );
      const waitResult = await this.waitForTerminal(delegation.id, remainingMs);
      if (waitResult === "timeout" && isActiveStatus(delegation.status)) {
        await this.handleTimeout(delegation.id);
      }
    }
    if (isTerminalStatus(delegation.status)) {
      const delayedPersisted = await this.waitForPersistedArtifact(
        delegation.artifact.filePath,
        Math.max(this.readPollIntervalMs * 8, 500)
      );
      if (delayedPersisted !== null) {
        this.markRetrieved(delegation.id, sessionID);
        return delayedPersisted;
      }
    }
    const persisted = await this.readPersistedArtifact(delegation.artifact.filePath);
    if (persisted !== null) {
      this.markRetrieved(delegation.id, sessionID);
      return persisted;
    }
    if (isTerminalStatus(delegation.status)) {
      return this.buildDeterministicTerminalReadResponse(delegation);
    }
    return `Delegation "${delegation.id}" is still running. You will receive a <task-notification> when it reaches a terminal state.`;
  }
  /**
   * List all delegations for a session
   */
  async listDelegations(sessionID) {
    const rootSessionID = await this.getRootSessionID(sessionID);
    const results = [];
    for (const delegation of this.delegations.values()) {
      if (!this.isVisibleToSession(delegation, rootSessionID)) continue;
      results.push({
        id: delegation.id,
        status: delegation.status,
        title: delegation.title || delegation.id,
        description: delegation.description || (delegation.status === "running" || delegation.status === "registered" ? "(running)" : "(no description)"),
        agent: delegation.agent,
        unread: this.hasUnreadCompletion(delegation)
      });
    }
    try {
      const dir = await this.getDelegationsDir(rootSessionID);
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file.endsWith(".md")) {
          const id = file.replace(".md", "");
          if (!results.find((r) => r.id === id)) {
            let title = "(loaded from storage)";
            let description = "";
            let agent;
            let status = "complete";
            try {
              const filePath = path2.join(dir, file);
              const content = await fs.readFile(filePath, "utf8");
              const titleMatch = content.match(/^# (.+)$/m);
              if (titleMatch) title = titleMatch[1];
              const agentMatch = content.match(/^\*\*Agent:\*\* (.+)$/m);
              if (agentMatch) agent = agentMatch[1];
              const statusMatch = content.match(/^\*\*Status:\*\* (.+)$/m);
              status = parsePersistedStatus(statusMatch?.[1]?.trim());
              const lines = content.split("\n");
              if (lines.length > 2 && lines[2]) {
                description = lines[2].slice(0, 150);
              }
            } catch {
            }
            results.push({
              id,
              status,
              title,
              description,
              agent,
              unread: false
            });
          }
        }
      }
    } catch {
    }
    results.sort((a, b) => a.id.localeCompare(b.id));
    return results;
  }
  /**
   * Delete a delegation by id (cancels if running, removes from storage)
   * Used internally for cleanup (timeout, etc.)
   */
  async deleteDelegation(sessionID, id) {
    const normalizedId = normalizeId(id);
    const delegation = this.delegations.get(normalizedId);
    if (delegation) {
      if (isActiveStatus(delegation.status)) {
        try {
          await this.client.session.delete({
            path: { id: delegation.sessionID }
          });
        } catch {
        }
        this.markTerminal(delegation.id, "cancelled", "Delegation deleted by cleanup");
      }
      this.clearTimeoutTimer(delegation.id);
      this.terminalWaiters.delete(delegation.id);
      this.delegationsBySession.delete(delegation.sessionID);
      this.delegations.delete(delegation.id);
    }
    try {
      const dir = await this.getDelegationsDir(sessionID);
      const filePath = path2.join(dir, `${normalizedId}.md`);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Find a delegation by its session ID
   */
  findBySession(sessionID) {
    return this.getDelegationBySession(sessionID);
  }
  /**
   * Handle message events for progress tracking
   */
  handleMessageEvent(sessionID, messageText) {
    const delegation = this.findBySession(sessionID);
    if (!delegation) return;
    this.markProgress(delegation.id, messageText);
  }
  /**
   * Get count of pending delegations for a parent session
   */
  getPendingCount(parentSessionID) {
    const pendingSet = this.pendingByParent.get(parentSessionID);
    if (!pendingSet) return 0;
    return Array.from(pendingSet).filter((id) => {
      const delegation = this.delegations.get(id);
      return delegation ? isActiveStatus(delegation.status) : false;
    }).length;
  }
  /**
   * Get all currently running delegations (in-memory only)
   */
  getRunningDelegations(rootSessionID) {
    return Array.from(this.delegations.values()).filter((delegation) => {
      if (rootSessionID && delegation.rootSessionID !== rootSessionID) return false;
      return isActiveStatus(delegation.status);
    });
  }
  getUnreadCompletedDelegations(rootSessionID, limit = 10) {
    return Array.from(this.delegations.values()).filter((delegation) => delegation.rootSessionID === rootSessionID).filter((delegation) => this.hasUnreadCompletion(delegation)).sort((a, b) => {
      const aTime = a.completedAt?.getTime() || 0;
      const bTime = b.completedAt?.getTime() || 0;
      return bTime - aTime;
    }).slice(0, limit);
  }
  /**
   * Get recent completed delegations for compaction injection
   */
  async getRecentCompletedDelegations(sessionID, limit = 10) {
    const all = await this.listDelegations(sessionID);
    return all.filter((d) => isTerminalStatus(d.status)).slice(-limit);
  }
  /**
   * Log debug messages
   */
  async debugLog(msg) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const line = `${timestamp}: ${msg}
`;
    const debugFile = path2.join(this.baseDir, "background-agents-debug.log");
    try {
      await fs.appendFile(debugFile, line, "utf8");
    } catch {
    }
  }
};
function createDelegate(manager) {
  return tool({
    description: `Delegate a task to an agent. Returns immediately with a readable ID.

Use this for:
- Research tasks (will be auto-saved)
- Parallel work that can run in background
- Any task where you want persistent, retrievable output

On completion, a notification will arrive with the ID and terminal summary.
Use \`delegation_read\` with the ID to retrieve full persisted output (including after compaction).`,
    args: {
      prompt: tool.schema.string().describe("The full detailed prompt for the agent. Must be in English."),
      agent: tool.schema.string().describe(
        'Agent to delegate to. Must be a read-only sub-agent (edit/write/bash denied), such as "researcher" or "explore".'
      )
    },
    async execute(args, toolCtx) {
      if (!toolCtx?.sessionID) {
        return "\u274C delegate requires sessionID. This is a system error.";
      }
      if (!toolCtx?.messageID) {
        return "\u274C delegate requires messageID. This is a system error.";
      }
      try {
        const delegation = await manager.delegate({
          parentSessionID: toolCtx.sessionID,
          parentMessageID: toolCtx.messageID,
          parentAgent: toolCtx.agent,
          prompt: args.prompt,
          agent: args.agent
        });
        const pendingSet = manager.getPendingCount(toolCtx.sessionID);
        const totalActive = pendingSet;
        let response = `Delegation started: ${delegation.id}
Agent: ${args.agent}`;
        if (totalActive > 1) {
          response += `

${totalActive} delegations now active.`;
        }
        response += `
You WILL be notified when ${totalActive > 1 ? "ALL complete" : "complete"}. Do NOT poll.`;
        return response;
      } catch (error) {
        return `\u274C Delegation failed:

${error instanceof Error ? error.message : "Unknown error"}`;
      }
    }
  });
}
function createDelegationRead(manager) {
  return tool({
    description: `Read the output of a delegation by its ID.
Use this to retrieve results from delegated tasks if the inline notification was lost during compaction.`,
    args: {
      id: tool.schema.string().describe("The delegation ID (e.g., 'elegant-blue-tiger')")
    },
    async execute(args, toolCtx) {
      if (!toolCtx?.sessionID) {
        return "\u274C delegation_read requires sessionID. This is a system error.";
      }
      return await manager.readOutput(toolCtx.sessionID, args.id);
    }
  });
}
function createDelegationList(manager) {
  return tool({
    description: `List all delegations for the current session.
Shows both running and completed delegations.`,
    args: {},
    async execute(_args, toolCtx) {
      if (!toolCtx?.sessionID) {
        return "\u274C delegation_list requires sessionID. This is a system error.";
      }
      const delegations = await manager.listDelegations(toolCtx.sessionID);
      if (delegations.length === 0) {
        return "No delegations found for this session.";
      }
      const lines = delegations.map((d) => {
        const titlePart = d.title ? ` | ${d.title}` : "";
        const unreadPart = d.unread ? " [unread]" : "";
        const descPart = d.description ? `
  \u2192 ${d.description}` : "";
        return `- **${d.id}**${titlePart} [${d.status}]${unreadPart}${descPart}`;
      });
      return `## Delegations

${lines.join("\n")}`;
    }
  });
}
var DELEGATION_RULES = `<task-notification>
<delegation-system>

## Async Delegation

You have tools for parallel background work:
- \`delegate(prompt, agent)\` - Launch task, returns ID immediately
- \`delegation_read(id)\` - Retrieve completed result
- \`delegation_list()\` - List delegations (use sparingly)

## Delegation Routing

Agents route based on their permissions:

| Agent Type | Tool | Why |
|------------|------|-----|
| Read-only sub-agents (edit/write/bash denied) | \`delegate\` | Background session, async |
| Write-capable sub-agents (any write permission) | \`task\` | Native task, preserves undo/branching |

**Read-only sub-agents** have edit="deny", write="deny", bash={"*":"deny"}.
**Write-capable sub-agents** have any write tool enabled.

## How It Works

1. For read-only sub-agents: Call \`delegate\` with detailed prompt
2. For write-capable sub-agents: Call \`task\` with detailed prompt
3. Continue productive work while it runs
4. Receive notification when complete
5. Call \`delegation_read(id)\` to retrieve results

## Critical Constraints

**NEVER poll \`delegation_list\` to check completion.**
You WILL be notified via \`<task-notification>\`. Polling wastes tokens.

**NEVER wait idle.** Always have productive work while delegations run.

**Using wrong tool will fail fast with guidance.**

</delegation-system>
</task-notification>`;
function formatDelegationContext(running, unreadCompleted) {
  const sections = ["<delegation-context>"];
  if (running.length > 0) {
    sections.push("## Running Delegations");
    sections.push("");
    for (const d of running) {
      sections.push(`### \`${d.id}\`${d.agent ? ` (${d.agent})` : ""}`);
      if (d.startedAt) {
        sections.push(`**Started:** ${d.startedAt.toISOString()}`);
      }
      if (d.lastHeartbeatAt) {
        sections.push(`**Last heartbeat:** ${d.lastHeartbeatAt.toISOString()}`);
      }
      if (d.prompt) {
        const truncatedPrompt = d.prompt.length > 200 ? `${d.prompt.slice(0, 200)}...` : d.prompt;
        sections.push(`**Prompt:** ${truncatedPrompt}`);
      }
      sections.push("");
    }
    sections.push(
      "> **Note:** You WILL be notified via `<task-notification>` when delegations complete."
    );
    sections.push("> Do NOT poll `delegation_list` - continue productive work.");
    sections.push("");
  }
  if (unreadCompleted.length > 0) {
    sections.push("## Unread Completed Delegations");
    sections.push("");
    for (const d of unreadCompleted) {
      const statusEmoji = d.status === "complete" ? "\u2705" : d.status === "error" ? "\u274C" : d.status === "timeout" ? "\u23F1\uFE0F" : "\u{1F6AB}";
      sections.push(`### ${statusEmoji} \`${d.id}\``);
      sections.push(`**Title:** ${d.title || "(no title)"}`);
      sections.push(`**Status:** ${d.status}`);
      sections.push(`**Description:** ${d.description || "(no description)"}`);
      if (d.completedAt) {
        sections.push(`**Completed:** ${d.completedAt.toISOString()}`);
      }
      sections.push(`**Retrieve:** \`delegation_read("${d.id}")\``);
      sections.push("");
    }
    sections.push("> These are unread terminal delegations carried forward through compaction.");
    sections.push("");
  }
  sections.push("## Retrieval");
  sections.push('Use `delegation_read("id")` to access full delegation output.');
  sections.push("Do not poll delegation_list for completion; rely on task notifications.");
  sections.push("</delegation-context>");
  return sections.join("\n");
}
var BackgroundAgentsPlugin = async (ctx) => {
  const { client, directory } = ctx;
  const log = createLogger(client);
  const projectId = await getProjectId(directory);
  const baseDir = path2.join(os.homedir(), ".local", "share", "opencode", "delegations", projectId);
  await fs.mkdir(baseDir, { recursive: true });
  const manager = new DelegationManager(client, baseDir, log);
  await manager.debugLog("BackgroundAgentsPlugin initialized with delegation system");
  return {
    tool: {
      delegate: createDelegate(manager),
      delegation_read: createDelegationRead(manager),
      delegation_list: createDelegationList(manager)
    },
    // Prevent read-only agents from using native task tool (symmetric to delegate enforcement)
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "task") return;
      const agentName = output.args?.subagent_type;
      if (!agentName) return;
      const { isSubAgent } = await parseAgentMode(client, agentName, log);
      if (!isSubAgent) return;
      const { isReadOnly } = await parseAgentWriteCapability(
        client,
        agentName,
        log
      );
      if (!isReadOnly) return;
      throw new Error(
        `\u274C Agent '${agentName}' is read-only and should use the delegate tool for async background execution.

Read-only agents have: edit="deny", write="deny", bash={"*":"deny"}
Use delegate for read-only sub-agents.
Use task for write-capable sub-agents.`
      );
    },
    // Inject delegation rules into system prompt (APPEND to last system string
    // so Qwen3.x strict Jinja templates don't reject a 2nd system message)
    "experimental.chat.system.transform": async (_input, output) => {
      if (output.system.length > 0) {
        output.system[output.system.length - 1] += "\n\n" + DELEGATION_RULES;
      } else {
        output.system.push(DELEGATION_RULES);
      }
    },
    // Deliver queued parent notifications on the next user turn if direct delivery failed.
    "chat.message": async (input, output) => {
      if (!input.sessionID) return;
      manager.injectPendingNotificationsIntoChatMessage(output, input.sessionID);
    },
    // Compaction hook - inject delegation context for context recovery
    "experimental.session.compacting": async (input, output) => {
      const rootSessionID = await manager.getRootSessionID(input.sessionID);
      const running = manager.getRunningDelegations(rootSessionID).map((d) => ({
        id: d.id,
        agent: d.agent,
        title: d.title,
        description: d.description,
        status: d.status,
        startedAt: d.startedAt,
        lastHeartbeatAt: d.progress.lastHeartbeatAt,
        prompt: d.prompt
      }));
      const unreadCompleted = manager.getUnreadCompletedDelegations(rootSessionID, 10).map((d) => ({
        id: d.id,
        agent: d.agent,
        title: d.title,
        description: d.description,
        status: d.status,
        completedAt: d.completedAt
      }));
      if (running.length === 0 && unreadCompleted.length === 0) return;
      output.context.push(formatDelegationContext(running, unreadCompleted));
    },
    // Event hook
    event: async ({ event }) => {
      if (event.type === "session.status") {
        const statusType = event.properties.status?.type;
        const sessionID = event.properties.sessionID;
        if (statusType === "idle" && sessionID) {
          await manager.handleSessionIdle(sessionID);
        }
      }
      if (event.type === "session.idle") {
        const sessionID = event.properties.sessionID;
        if (sessionID) {
          await manager.handleSessionIdle(sessionID);
        }
      }
      if (event.type === "message.updated") {
        const eventProperties = event.properties;
        const sessionID = eventProperties.info.sessionID;
        if (sessionID) {
          const messageText = eventProperties.info.role === "assistant" ? eventProperties.parts?.filter((part) => part.type === "text").map((part) => part.text).join("\n") ?? void 0 : void 0;
          manager.handleMessageEvent(sessionID, messageText);
        }
      }
    }
  };
};
var BackgroundAgentsPluginWithInternals = Object.assign(BackgroundAgentsPlugin, {
  testInternals: {
    DelegationManager,
    formatDelegationContext
  }
});
var background_agents_default = BackgroundAgentsPluginWithInternals;
export {
  background_agents_default as default
};
