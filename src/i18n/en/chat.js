/**
 * English interactive chat data
 * Extracted from Chat.jsx
 */

export const CHARACTERS = {
  kane: {
    name: "Prince Kane",
    role: "Lion Clan · Crown Prince",
    level: 3,
    levelLabel: "Entangled",
    intimacy: 0,
    intimacyMax: 100,
    image: "https://s3plus.meituan.net/mcopilot-pub/nocode_image/default/kane-avatar-55f570vnoa17povjwjklzgbdkix83z.jpg",
  },
};

export const EPISODE_SUMMARIES = {
  1:  "Fleeing wolves in a storm, Elena stumbled into an abandoned shack — only to find a man blazing with uncontrolled psionic energy. To save him, she gave herself.",
  2:  "Morning. Elena woke alone and realized she was pregnant. Then her father ordered her to marry the notorious 'killing machine' — Prince Kane.",
  3:  "Bathing in peace, Elena was cornered by her cruel sister who discovered the pregnancy and threatened to expose her secrets.",
  4:  "Kane burst through the window in gold flames, hurling Elena's tormentors aside. 'Who says I won't defend her?' His first words to her.",
  5:  "Kane declared to all the empire: 'Elena is my wife. Disrespect her and you challenge me.' Then he lifted her chin and offered a rose.",
  6:  "Kane touched Elena's rabbit ears in the pool — and felt a power strangely familiar, like the girl from the shack. He was not yet certain.",
  7:  "On consummation night, Kane helped Elena dress in her wedding gown, whispering dangerous promises in her ear: 'Tonight, I will take my time.'",
  8:  "A royal announcement. Elena was introduced as princess. Ludwig appeared — and Kane seized her chin with burning eyes: 'Eyes on me. You belong to me.'",
  9:  "Kane noticed Elena's rabbit tail trembling during the flight and made brazen promises. Ludwig followed close behind — a tense triangle in the sky.",
  10: "Before the Canon altar, Elena had to swear purity. But she was pregnant. The ancient book would know if she lied — and she would be torn apart.",
  11: "Elena resolved to use her powers to deceive the Canon. Kane held her steady: 'Nothing will happen as long as I am here.' She pressed her hand to the book.",
  12: "The Canon glowed gold — and acknowledged Elena as pure. Sister Beatrice raged. Elena was stunned: had her power hidden the truth, or was something else at work?",
  13: "Kane carried Elena to the consummation chamber. His eyes glowed gold, his fangs lengthened. 'Are you ready to feel me inside of you?'",
  14: "The High Priest waited outside. Beatrice crowed over Elena's doom. Kane tore at her corset: 'They won't leave until I make you cry out.'",
  15: "Elena whispered she wanted this to be with someone she loved. Kane replied: 'I don't know how to make love. I only know how to fuck.' His eyes burned. The show began.",
};

export const EPISODE_OPENINGS = {
  1: {
    prose: [
      "You are Elena von Adrian — golden-haired daughter of a noble beast clan, with soft pink rabbit ears and a power for healing that blooms like light.",
      "Tonight the forest hunts you. Wolves with glowing eyes close in from every side, and your feet barely find purchase in the mud as you run.",
      "Ahead — a broken shack. You throw yourself inside, gasping for breath.",
      "And then you see him. A man on his knees in the centre of the room, his bare torso cracked with glowing gold fissures, flame blazing from his skin like lava. He is dying from the inside out.",
      "He turns. A gold beast-mask hides his face. His voice is a snarl.",
    ],
    dialogue: `"Get out — before I lose control!"`,
    proseAfterDialogue: [
      "You should run. Every instinct says run.",
      "But you are a healer. And he saved you first — he destroyed the wolf at the door without even meaning to.",
      "Your rabbit ears rise. Your palms begin to glow. You take one step toward him.",
    ],
    choices: [
      { label: "[Healer's Instinct] Approach him — place your hands on his burning skin and pour everything you have into him.", next: "ep1_branch_a", intimacyGain: 10, isFixed: true },
      { label: "[Fear] Back against the wall, refusing to move until the flames die down.", next: "ep1_branch_b", intimacyGain: 5, isFixed: true },
      { label: "[Desperate Bargain] 'I'll help you — but you have to protect me first. Promise me.'", next: "ep1_branch_c", intimacyGain: 8, isFixed: true },
    ],
    inputHint: "He is burning alive. You hold the power to stop it. What do you do?",
  },
  2: {
    prose: [
      "You slip out of the shack before dawn, dress still torn, fingers trembling.",
      "Back in the castle, the truth comes quietly — a warm glow at your abdomen. You press your hand there in the bath.",
      "You are pregnant.",
      "The father's face is hidden behind gold. You never even saw his eyes.",
      "Then your handmaiden knocks: your father summons you to the council chamber immediately.",
    ],
    dialogue: `"Her Majesty has decided our family must offer the purest daughter to marry Prince Kane — the killing machine."`,
    proseAfterDialogue: [
      "Your father's voice is utterly flat. He has already decided.",
      "Your sister smiles from across the room. You know that smile.",
      "On consummation night, if the bride cannot offer virgin's blood — she will be torn apart by beasts.",
    ],
    choices: [
      { label: "Beg your father to spare you — confess that you are no longer untouched.", next: "s1", intimacyGain: 6 },
      { label: "Stay silent and start calculating — there has to be a way out.", next: "s1", intimacyGain: 8 },
      { label: "Look at your sister and understand in an instant: she planned all of this.", next: "s1", intimacyGain: 7 },
      { label: "Lift your chin: 'I understand. I will go.'", next: "s1", intimacyGain: 5 },
    ],
    inputHint: "A death sentence wrapped in a wedding dress. How do you face it?",
  },
  3: {
    prose: [
      "You try to hide it. You layer your dresses carefully each morning, pressing your palms over the soft warmth that pulses at your waist.",
      "But your sister finds you in the bath.",
      "She stands at the pool's edge, her black lace gown pooling on the marble, a smile like a blade.",
      "Her handmaid is at her side — both of them watching you with predator's eyes.",
    ],
    dialogue: `"My little sister — you're going to die in Prince Kane's bed. I came to see you off."`,
    proseAfterDialogue: [
      "You reach for your towel. Your hands are not steady.",
      "'Word is,' she says, stepping closer, 'every night, Kane buries a woman's body in his garden. Just to use them as fertilizer.'",
      "She leans down. Her eyes drop to your stomach. And then they sharpen.",
      "'Elena. You are pregnant.'",
    ],
    choices: [
      { label: "Pull your knees to your chest and say nothing — let her believe she's wrong.", next: "s1", intimacyGain: 5 },
      { label: "'You set me up. That night in the forest — it was you who locked me out there.'", next: "s1", intimacyGain: 9 },
      { label: "Release a burst of your healing light — not to hurt her, but to warn her back.", next: "s1", intimacyGain: 7 },
      { label: "(Stay absolutely still, let her see nothing in your face.)", next: "s1", intimacyGain: 6 },
    ],
    inputHint: "Your sister has found your secret. What is your move?",
  },
  4: {
    prose: [
      "The magic coils around your throat like a vine. You cannot breathe.",
      "Beatrice watches you suffocate with quiet delight. 'Prince Kane will torture you to death the moment he learns what you are hiding,' she says.",
      "You close your eyes.",
      "Then — the window explodes inward.",
      "Gold light floods the room. The force of it hurls your sister across the floor.",
    ],
    dialogue: `"Who says I won't defend her?"`,
    proseAfterDialogue: [
      "He lands between you and them — gold armor scattered with blood, lion ears flat against his skull, eyes burning.",
      "He did not even look at you. He is still looking at them.",
      "You realise: he caught you before you fell.",
    ],
    choices: [
      { label: "'Prince Kane…' (your voice barely works, but you say his name.)", next: "s1", intimacyGain: 9 },
      { label: "Reach for his arm to steady yourself — your legs won't hold.", next: "s1", intimacyGain: 10 },
      { label: "Look at him and feel something shift in your chest that has no name yet.", next: "s1", intimacyGain: 8 },
      { label: "Try to stand on your own. You will not let him see you collapse.", next: "s1", intimacyGain: 6 },
    ],
    inputHint: "He just saved your life. What do you do in this moment?",
  },
  5: {
    prose: [
      "He stands in the pool with you, water swirling gold at his knees, and he does not look like a man who just threw two women out a window.",
      "He looks bored.",
      "But his hand is very carefully tilting your chin up.",
      "A red rose, still damp from somewhere, appears between his fingers.",
    ],
    dialogue: `"You really are the purest female in the empire. Turns out, coming all the way from the war wasn't a waste of time."`,
    proseAfterDialogue: [
      "You look at the rose. You look at him.",
      "He is not kind. He is possibly still dangerous. He saved you for reasons you don't understand.",
      "But he is holding a flower, and his thumb is resting against your jaw like it belongs there.",
    ],
    choices: [
      { label: "Take the rose, slowly, with both hands.", next: "s1", intimacyGain: 10 },
      { label: "'Thank you — for what you did.' Keep your voice level.", next: "s1", intimacyGain: 8 },
      { label: "Look him directly in the eye. 'Why did you come back from the war for this?'", next: "s1", intimacyGain: 9 },
      { label: "(Say nothing. Just breathe.)", next: "s1", intimacyGain: 6 },
    ],
    inputHint: "He is offering you a rose in a pool. What does it mean to accept?",
  },
  6: {
    prose: [
      "His gloved fingers slip past your lips before you know what is happening.",
      "Your ears appear — you cannot stop them — pink and trembling and completely exposed.",
      "He stares at them. Something passes across his face.",
      "His own skin still bears the ghost of those gold fissures. A power he half-remembers, stronger than this, from a night he cannot fully recall.",
    ],
    dialogue: `"This power… why does it feel so familiar?"`,
    proseAfterDialogue: [
      "'But it seems weaker than what I felt that night,' he murmurs. 'It can't be her.'",
      "His hand is still resting against your ear.",
      "'Whoa.' He tilts his head. 'I only touched your ears and you're already turned on?'",
    ],
    choices: [
      { label: "'Don't flatter yourself.' (Your face is completely red.)", next: "s1", intimacyGain: 8 },
      { label: "(Try very hard not to make a sound.)", next: "s1", intimacyGain: 7 },
      { label: "'You're the one who started touching me without asking.'", next: "s1", intimacyGain: 10 },
      { label: "Cover your ears with both hands and look away.", next: "s1", intimacyGain: 6 },
    ],
    inputHint: "He touched your ears. Your body responded against your will. What now?",
  },
  7: {
    prose: [
      "The ceremony is tonight.",
      "He is lacing your wedding dress from behind, his gloves discarded, fingers working each tie with deliberate patience.",
      "His mouth is very close to your ear.",
    ],
    dialogue: `"I'm doing this only to remember how to undo this dress later."`,
    proseAfterDialogue: [
      "'Tonight,' he says, 'I'll strip you down way more slowly.'",
      "You open your mouth. He sets the final clasp and steps back to look at you.",
      "He raises one hand and a crown of light forms from nothing, settling onto your hair.",
      "'All set,' he says, as if none of that other sentence happened.",
    ],
    choices: [
      { label: "'You cannot say things like that before a ceremony.'", next: "s1", intimacyGain: 8 },
      { label: "(Look at yourself in the glass — you look like a bride, and you feel like prey.)", next: "s1", intimacyGain: 7 },
      { label: "'Do you actually want this? Any of this?'", next: "s1", intimacyGain: 10 },
      { label: "Say nothing. Hold very still.", next: "s1", intimacyGain: 6 },
    ],
    inputHint: "He dressed you like a weapon and you are about to walk into a wedding. How do you face him?",
  },
  8: {
    prose: [
      "The guards announce you as the crowd kneels: Princess Elena.",
      "Through the gold and the noise, you see him — silver hair, silver armor, white wolf-ears.",
      "Ludwig.",
      "Your name was on his lips before this. Before any of this.",
    ],
    dialogue: `"Did I say you could look at him?"`,
    proseAfterDialogue: [
      "Kane's hand catches your chin before you realise you have moved.",
      "He turns your face back to his. His eyes are burning gold.",
      "'Remember. You belong to me. Eyes on me. Don't you dare look at anyone else.'",
    ],
    choices: [
      { label: "'I was not looking. I was remembering.'", next: "s1", intimacyGain: 7 },
      { label: "Meet his eyes without flinching.", next: "s1", intimacyGain: 10 },
      { label: "(Say nothing. Obey. But feel something cold and sharp inside you.)", next: "s1", intimacyGain: 5 },
      { label: "'You're hurting me. Please.'", next: "s1", intimacyGain: 8 },
    ],
    inputHint: "He caught you looking at Ludwig. How do you respond to his possession?",
  },
  9: {
    prose: [
      "You are on the back of a dragon, and the sky is open in every direction.",
      "His arm is around you from behind — not gentle, but certain.",
      "Your tail is trembling. You cannot stop it.",
      "He notices. Of course he notices.",
    ],
    dialogue: `"Your tail is trembling. Like you're in heat…"`,
    proseAfterDialogue: [
      "'Do you want me to fuck you right now — in the air?'",
      "Behind you, at a dragon-length's distance, Ludwig follows.",
      "Three of you, suspended between the clouds, and no one is saying what needs to be said.",
    ],
    choices: [
      { label: "'Stop it. There are people watching.'", next: "s1", intimacyGain: 7 },
      { label: "(Look straight ahead and pretend you heard nothing.)", next: "s1", intimacyGain: 5 },
      { label: "Let yourself lean back — just slightly — against his chest.", next: "s1", intimacyGain: 10 },
      { label: "'Is Ludwig the only reason you're saying these things?'", next: "s1", intimacyGain: 9 },
    ],
    inputHint: "He's taunting you in the sky while Ludwig watches. What's your move?",
  },
  10: {
    prose: [
      "The Canon altar stands at the centre of the great hall.",
      "The book floats at eye level, humming with silver light.",
      "Around you: the Queen, the High Priest, Beatrice — and Kane, standing a step behind your shoulder.",
      "The High Priest's voice fills the vaulted stone:",
    ],
    dialogue: `"Princess Elena — swear before the God of Moon that you will keep your purity for Prince Kane, and bear him pure-blood heirs. If you lie, the Canon will know. You will be torn apart."`,
    proseAfterDialogue: [
      "You look at the book.",
      "Your hands are shaking. The child inside you pulses, warm and present and unmistakable.",
      "Beatrice is smiling.",
      "And behind your shoulder, Kane has not moved.",
    ],
    choices: [
      { label: "Reach for the book. Your power can hide this. It has to.", next: "ep10_branch_a", intimacyGain: 9, isFixed: true },
      { label: "[Turn to Kane] — look at him and let him see in your face what you cannot say aloud.", next: "ep10_branch_b", intimacyGain: 8, isFixed: true },
      { label: "[Confess] 'I cannot swear this. There is something you must all know.'", next: "ep10_branch_c", intimacyGain: 6, isFixed: true },
    ],
    inputHint: "The Canon knows all lies. You are carrying a secret it may expose. What do you do?",
  },
  11: {
    prose: [
      "A pillar of violet light crashes down from above and strikes you where you stand.",
      "You are falling.",
      "Then you are not.",
      "Someone caught you. Someone with gold hair and warm arms and the smell of smoke and iron.",
    ],
    dialogue: `"Don't worry. Nothing will happen as long as I'm here."`,
    proseAfterDialogue: [
      "You look up at him and you do not understand what is in his face.",
      "But you understand what you are about to do.",
      "Inside you, very quietly, you make a promise — not to the Canon, but to the child you are carrying, and to yourself.",
      "You raise your hand toward the floating book.",
    ],
    choices: [
      { label: "Press your palm flat to the surface. Pour everything into making it believe you.", next: "s1", intimacyGain: 10 },
      { label: "Hold Kane's arm with your free hand as you reach for the Canon.", next: "s1", intimacyGain: 9 },
      { label: "(Close your eyes. If you cannot survive, at least you tried.)", next: "s1", intimacyGain: 7 },
      { label: "Whisper under your breath: 'I will not die here. Not yet.'", next: "s1", intimacyGain: 8 },
    ],
    inputHint: "Kane is holding you. You are reaching for the book that could end you. What do you feel?",
  },
  12: {
    prose: [
      "Gold light.",
      "Then silence.",
      "Then the High Priest's voice, loud and certain across the entire hall:",
    ],
    dialogue: `"The Canon acknowledges the Princess. The oath is made."`,
    proseAfterDialogue: [
      "Beatrice's face goes white.",
      "Kane, beside you, does not move — but something in his stillness changes.",
      "You stand there with your hand still pressed to the warm cover of the Canon and you think:",
      "I passed. How did I pass?",
    ],
    choices: [
      { label: "Let your hand drop. Keep your face completely still.", next: "s1", intimacyGain: 7 },
      { label: "Look at Kane. Something happened. You need to know if he felt it.", next: "s1", intimacyGain: 10 },
      { label: "(Close your eyes for one second — just one — and breathe.)", next: "s1", intimacyGain: 8 },
      { label: "Look at Beatrice and let her see that you are still standing.", next: "s1", intimacyGain: 9 },
    ],
    inputHint: "You survived. The Canon believed you. What happens inside you in this moment?",
  },
  13: {
    prose: [
      "He carried you across the threshold.",
      "The room is all dark stone and deep silk and candlelight that makes everything gold.",
      "He sets you down on the edge of the bed and does not step back.",
      "His eyes have changed. The pupils are slitted now — predator-wide in the dark.",
      "His voice drops to something that is not quite a growl.",
    ],
    dialogue: `"Are you ready to feel me inside of you?"`,
    proseAfterDialogue: [
      "Outside, the High Priest waits. The Queen waits. The entire empire waits for proof.",
      "And you are here, in this room, with him.",
    ],
    choices: [
      { label: "[Hold his gaze] 'Will you at least tell me your name? Your real name — not your title.'", next: "ep13_branch_a", intimacyGain: 9, isFixed: true },
      { label: "[Show him] Reach up and press his hand — palm to palm — and let your healing light surface.", next: "ep13_branch_b", intimacyGain: 10, isFixed: true },
      { label: "[Ask] 'Do you know who I am to you? Have you dreamed of me before this night?'", next: "ep13_branch_c", intimacyGain: 8, isFixed: true },
    ],
    inputHint: "This is the consummation chamber. His eyes are glowing. You are about to share the most dangerous night of your life.",
  },
  14: {
    prose: [
      "He tears the laces from your corset one by one, unhurried.",
      "Your tears fall and he does not pretend not to see them.",
      "'Please,' you say, 'not like this.'",
      "'How?' he asks, almost lazily. 'With which part of your body?'",
      "Through the closed door, you hear the High Priest's voice:",
    ],
    dialogue: `"Your Highness — do not miss the hour the God of Moon arrives. We are waiting to witness the Princess's blood."`,
    proseAfterDialogue: [
      "Kane's eyes move to the door. When they come back to you, something in them is different.",
      "Not softer. But slower. Like a question he is trying to formulate.",
    ],
    choices: [
      { label: "'You don't want them watching any more than I do. Help me think of something.'", next: "s1", intimacyGain: 10 },
      { label: "Look at the door, then back at him. 'Is this what you wanted? A wife who is afraid of you?'", next: "s1", intimacyGain: 9 },
      { label: "(Stop crying. If you can't stop what is coming, be present for it.)", next: "s1", intimacyGain: 7 },
      { label: "'I will do whatever the ritual requires. But I need you to look at me like a person, not a rite.'", next: "s1", intimacyGain: 8 },
    ],
    inputHint: "The High Priest is outside. Kane is in front of you. What do you say to him?",
  },
  15: {
    prose: [
      "You are still crying. He is not trying to stop the tears anymore.",
      "'I was supposed to do this with someone I love,' you say.",
      "He pauses.",
      "The candles gutter.",
      "He looks at you for a long moment and his voice is very even.",
    ],
    dialogue: `"Love? Elena — remember this: I don't know how to make love. I only know how to fuck."`,
    proseAfterDialogue: [
      "'Don't look at me like that,' he says, 'or I won't know if you can survive tonight.'",
      "Outside, Beatrice murmurs: 'Why is it so quiet? Shall we check in?'",
      "The Queen's voice carries through stone: 'Kane — begin the ritual. Or I will have the curtain drawn.'",
    ],
    choices: [
      { label: "'Then teach yourself. Starting tonight.'", next: "s1", intimacyGain: 10 },
      { label: "Reach up and touch his face — not with power, just with your hand.", next: "s1", intimacyGain: 9 },
      { label: "(Close the distance between you. There is nowhere left to retreat.)", next: "s1", intimacyGain: 8 },
      { label: "'I'm not afraid of you. I need you to know that.'", next: "s1", intimacyGain: 7 },
    ],
    inputHint: "He said he only knows how to fuck. The ritual must begin. What do you do?",
  },
};

export const FIXED_BRANCHES = {
  ep1_branch_a: {
    prose: [
      "You lay your glowing palms against his back — and the gold fissures spread to your skin immediately.",
      "The heat is extraordinary. It should be agony. But your rabbit instinct is to soothe, and something in you opens wide.",
      "He makes a sound that is half-snarl and half-something-else entirely.",
      "The flames begin to recede.",
      "But his hand has caught your wrist. Hard.",
    ],
    dialogue: `"You're the one from the shack."`,
    proseAfterDialogue: [
      "His mask has fallen. In the firelight you see gold eyes — wide, and remembering.",
      "You are tangled in his arms and the fire is fading and neither of you has spoken yet.",
    ],
    choices: [
      { label: "'Don't let go. Not yet — it's still working.'", next: null, intimacyGain: 10 },
      { label: "(Try to free your wrist — fail, and feel his grip tighten.)", next: null, intimacyGain: 7 },
      { label: "'You remember. Do you know what happened that night?'", next: null, intimacyGain: 9 },
    ],
    isFixedBranch: true,
    inputHint: "His power is fading under your hands. He is starting to remember. What do you say?",
  },
  ep1_branch_b: {
    prose: [
      "You press your back to the farthest wall and watch.",
      "The flames grow. The man tears at the floor with his bare hands. A beam of the ceiling chars and falls.",
      "He is going to die. Right in front of you. And you could stop it.",
      "Your hands begin to glow without your permission.",
    ],
    dialogue: `"What are you waiting for?"`,
    proseAfterDialogue: [
      "He looks at you. Gold eyes through the fire. He is asking — demanding — even now.",
      "You take the first step.",
    ],
    choices: [
      { label: "'I'm scared. But I'm coming.' Step toward him.", next: null, intimacyGain: 9 },
      { label: "(Run across the room and throw your arms around him — you have no other plan.)", next: null, intimacyGain: 10 },
      { label: "'Tell me what to do. Tell me how to help you.'", next: null, intimacyGain: 8 },
    ],
    isFixedBranch: true,
    inputHint: "Fear kept you back. Now he is looking at you. Do you still hesitate?",
  },
  ep1_branch_c: {
    prose: [
      "He stares at you through the fire.",
      "A laugh tears out of him — low and pained and absolutely genuine.",
      "'A bargain,' he says. 'You want a bargain. Now.'",
      "He is dying and you are negotiating and for some reason this seems to be working.",
    ],
    dialogue: `"Fine. Agreed. Now come here."`,
    proseAfterDialogue: [
      "He reaches for you. His hand is burning.",
      "You take it anyway.",
    ],
    choices: [
      { label: "'Remember this. You owe me.' Then give him everything you have.", next: null, intimacyGain: 10 },
      { label: "'Tell me your name first.'", next: null, intimacyGain: 9 },
      { label: "(Take his hand and start pouring your light into him without another word.)", next: null, intimacyGain: 8 },
    ],
    isFixedBranch: true,
    inputHint: "He agreed to your terms. His hand is in yours. What do you do first?",
  },
  ep10_branch_a: {
    prose: [
      "You take a breath so quiet no one around you can hear it.",
      "You pull every thread of your power inward, wrap it around the truth the way you would wrap a wound, and step forward.",
      "The Canon's light pulses — searching.",
      "You press your palm to its surface and speak the oath.",
    ],
    dialogue: `"I, Elena, swear I will be loyal to Prince Kane, keep my purity for him, and bear pure-blood heirs for the royal family."`,
    proseAfterDialogue: [
      "The book goes still.",
      "Then it glows — warm and gold — and does not accuse you.",
      "You are shaking so hard you can barely stand.",
    ],
    choices: [
      { label: "Pull your hand back slowly. Do not let them see you exhale.", next: null, intimacyGain: 10 },
      { label: "(Behind you, Kane has gone completely still. You feel him before you see him.)", next: null, intimacyGain: 9 },
      { label: "Look at Beatrice. Make eye contact. Smile, just slightly.", next: null, intimacyGain: 8 },
    ],
    isFixedBranch: true,
    inputHint: "The Canon accepted your oath. You are still alive. What do you do in the silence after?",
  },
  ep10_branch_b: {
    prose: [
      "You turn.",
      "He is right there — closer than you realised, closer than the ceremony requires.",
      "You look at him and you let everything be visible for one half-second:",
      "The fear. The secret. The child. The night in the shack that started all of this.",
      "He holds your gaze. Something crosses his face that has no name.",
    ],
    dialogue: `"…I see you."`,
    proseAfterDialogue: [
      "He says it very quietly. Only you can hear it.",
      "Then he does something you did not expect: he steps to your side, close enough that your arms are touching, and faces the Canon with you.",
    ],
    choices: [
      { label: "Let his arm press against yours. Draw strength from it. Reach for the book.", next: null, intimacyGain: 10 },
      { label: "'Will you still be standing there if the Canon rejects me?'", next: null, intimacyGain: 9 },
      { label: "(You don't say anything. You just turn back to the book and swear.)", next: null, intimacyGain: 8 },
    ],
    isFixedBranch: true,
    inputHint: "He said 'I see you.' He is standing beside you. What happens next?",
  },
  ep10_branch_c: {
    prose: [
      "Your voice comes out steadier than you expected.",
      "'I cannot take this oath,' you say. 'Not honestly. There is something all of you must know.'",
      "The hall goes very quiet.",
      "Beatrice looks delighted.",
      "The Queen's expression does not change at all, which is somehow worse.",
      "Then Kane speaks — fast, before anyone else can.",
    ],
    dialogue: `"She means that she cannot swear to things she does not yet understand. The oath will be given when it can be given truthfully. I will guarantee it."`,
    proseAfterDialogue: [
      "The room holds its breath.",
      "You look at him. He is looking at the Queen, not at you.",
      "But his hand has found yours in the space between your bodies, hidden by the folds of your dress.",
    ],
    choices: [
      { label: "Squeeze his hand once — barely enough to feel.", next: null, intimacyGain: 10 },
      { label: "(You don't understand why he did that. But for now, you let him.)", next: null, intimacyGain: 8 },
      { label: "Whisper, for his ears only: 'Thank you.'", next: null, intimacyGain: 9 },
    ],
    isFixedBranch: true,
    inputHint: "He covered for you in front of the entire court. His hand found yours. What do you do?",
  },
  ep13_branch_a: {
    prose: [
      "You hold his gaze.",
      "'What is your real name?' you ask. 'Not Prince Kane. Not the crown prince. Just — your name.'",
      "He goes still.",
      "Outside, nothing. The candles flicker.",
      "He looks at you like he has not been asked that in a very long time.",
    ],
    dialogue: `"…Kane. Just Kane."`,
    proseAfterDialogue: [
      "It costs him something to say it. You can see that.",
      "You take the sound of it and hold it carefully.",
      "'Just Kane,' you repeat. 'Then just Elena. We can start there.'",
    ],
    choices: [
      { label: "Hold out your hand — palm up, open. Not demanding. Offering.", next: null, intimacyGain: 10 },
      { label: "'Then just Kane — you should know. There is something I haven't told you.'", next: null, intimacyGain: 9 },
      { label: "(Watch his face as the tension in it changes — slowly — into something else.)", next: null, intimacyGain: 8 },
    ],
    isFixedBranch: true,
    inputHint: "He told you his name. Just his name. What comes next?",
  },
  ep13_branch_b: {
    prose: [
      "You reach up and take his hand from your shoulder, holding it between both of yours.",
      "He lets you.",
      "Your light surfaces without thought — golden-pink, the colour of your healing — and flows across his knuckles.",
      "His breath catches.",
      "He looks down at your joined hands, then at you.",
    ],
    dialogue: `"This is the same power. The shack. It was you."`,
    proseAfterDialogue: [
      "It is not a question.",
      "You have nowhere left to hide. You look at him and say nothing, and your answer is in every line of your face.",
      "He is very still. Then, slowly, he turns his palm upward in your hands.",
    ],
    choices: [
      { label: "'Yes. It was me. And the child you don't yet know about — is yours.'", next: null, intimacyGain: 10 },
      { label: "(Let your light keep flowing. There is nothing else you can offer except honesty.)", next: null, intimacyGain: 9 },
      { label: "'I didn't know it was you. I only knew I couldn't let you die.'", next: null, intimacyGain: 8 },
    ],
    isFixedBranch: true,
    inputHint: "He recognised your power. He knows. What do you say now?",
  },
  ep13_branch_c: {
    prose: [
      "'Have you dreamed of me?' you ask.",
      "He blinks. Once.",
      "'What kind of question is that for a wedding night?'",
      "'An honest one,' you say. 'I am trying to be honest with you tonight, even if it costs me something.'",
      "He looks at you for a very long time.",
    ],
    dialogue: `"…Gold hair. You smelled like rain and something sweet. I thought I'd invented you."`,
    proseAfterDialogue: [
      "You feel the ground shift beneath everything.",
      "He dreamed you. He carried you in his mind as something half-invented and half-remembered.",
      "And you are standing here in this room and it is real.",
    ],
    choices: [
      { label: "'I was real. I've always been real. And there is something else you should know — something real.'", next: null, intimacyGain: 10 },
      { label: "Step toward him. Close the distance. Let him see you properly.", next: null, intimacyGain: 9 },
      { label: "(Say nothing. Just look at him with everything you feel.)", next: null, intimacyGain: 8 },
    ],
    isFixedBranch: true,
    inputHint: "He dreamed of you without knowing it was you. What do you do with that?",
  },
};

export const STORY_SCENES = {
  "kane": [
    // Episode openings (flattened)
    {
      id: "ep1",
      prose: EPISODE_OPENINGS[1].prose,
      dialogue: EPISODE_OPENINGS[1].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[1].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[1].choices,
      inputHint: EPISODE_OPENINGS[1].inputHint,
    },
    {
      id: "ep2",
      prose: EPISODE_OPENINGS[2].prose,
      dialogue: EPISODE_OPENINGS[2].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[2].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[2].choices,
      inputHint: EPISODE_OPENINGS[2].inputHint,
    },
    {
      id: "ep3",
      prose: EPISODE_OPENINGS[3].prose,
      dialogue: EPISODE_OPENINGS[3].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[3].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[3].choices,
      inputHint: EPISODE_OPENINGS[3].inputHint,
    },
    {
      id: "ep4",
      prose: EPISODE_OPENINGS[4].prose,
      dialogue: EPISODE_OPENINGS[4].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[4].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[4].choices,
      inputHint: EPISODE_OPENINGS[4].inputHint,
    },
    {
      id: "ep5",
      prose: EPISODE_OPENINGS[5].prose,
      dialogue: EPISODE_OPENINGS[5].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[5].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[5].choices,
      inputHint: EPISODE_OPENINGS[5].inputHint,
    },
    {
      id: "ep6",
      prose: EPISODE_OPENINGS[6].prose,
      dialogue: EPISODE_OPENINGS[6].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[6].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[6].choices,
      inputHint: EPISODE_OPENINGS[6].inputHint,
    },
    {
      id: "ep7",
      prose: EPISODE_OPENINGS[7].prose,
      dialogue: EPISODE_OPENINGS[7].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[7].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[7].choices,
      inputHint: EPISODE_OPENINGS[7].inputHint,
    },
    {
      id: "ep8",
      prose: EPISODE_OPENINGS[8].prose,
      dialogue: EPISODE_OPENINGS[8].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[8].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[8].choices,
      inputHint: EPISODE_OPENINGS[8].inputHint,
    },
    {
      id: "ep9",
      prose: EPISODE_OPENINGS[9].prose,
      dialogue: EPISODE_OPENINGS[9].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[9].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[9].choices,
      inputHint: EPISODE_OPENINGS[9].inputHint,
    },
    {
      id: "ep10",
      prose: EPISODE_OPENINGS[10].prose,
      dialogue: EPISODE_OPENINGS[10].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[10].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[10].choices,
      inputHint: EPISODE_OPENINGS[10].inputHint,
    },
    {
      id: "ep11",
      prose: EPISODE_OPENINGS[11].prose,
      dialogue: EPISODE_OPENINGS[11].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[11].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[11].choices,
      inputHint: EPISODE_OPENINGS[11].inputHint,
    },
    {
      id: "ep12",
      prose: EPISODE_OPENINGS[12].prose,
      dialogue: EPISODE_OPENINGS[12].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[12].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[12].choices,
      inputHint: EPISODE_OPENINGS[12].inputHint,
    },
    {
      id: "ep13",
      prose: EPISODE_OPENINGS[13].prose,
      dialogue: EPISODE_OPENINGS[13].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[13].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[13].choices,
      inputHint: EPISODE_OPENINGS[13].inputHint,
    },
    {
      id: "ep14",
      prose: EPISODE_OPENINGS[14].prose,
      dialogue: EPISODE_OPENINGS[14].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[14].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[14].choices,
      inputHint: EPISODE_OPENINGS[14].inputHint,
    },
    {
      id: "ep15",
      prose: EPISODE_OPENINGS[15].prose,
      dialogue: EPISODE_OPENINGS[15].dialogue,
      proseAfterDialogue: EPISODE_OPENINGS[15].proseAfterDialogue || [],
      choices: EPISODE_OPENINGS[15].choices,
      inputHint: EPISODE_OPENINGS[15].inputHint,
    },
    // Fixed branches
    {
      ...FIXED_BRANCHES["ep1_branch_a"],
      id: "ep1_branch_a",
    },
    {
      ...FIXED_BRANCHES["ep1_branch_b"],
      id: "ep1_branch_b",
    },
    {
      ...FIXED_BRANCHES["ep1_branch_c"],
      id: "ep1_branch_c",
    },
    {
      ...FIXED_BRANCHES["ep10_branch_a"],
      id: "ep10_branch_a",
    },
    {
      ...FIXED_BRANCHES["ep10_branch_b"],
      id: "ep10_branch_b",
    },
    {
      ...FIXED_BRANCHES["ep10_branch_c"],
      id: "ep10_branch_c",
    },
    {
      ...FIXED_BRANCHES["ep13_branch_a"],
      id: "ep13_branch_a",
    },
    {
      ...FIXED_BRANCHES["ep13_branch_b"],
      id: "ep13_branch_b",
    },
    {
      ...FIXED_BRANCHES["ep13_branch_c"],
      id: "ep13_branch_c",
    },
    // AI entry point
    { id: "s1", prose: ["You are in the castle with Prince Kane."], dialogue: "", choices: [] },
  ],
};

const chat = { CHARACTERS, EPISODE_SUMMARIES, EPISODE_OPENINGS, FIXED_BRANCHES, STORY_SCENES };

export default chat;
