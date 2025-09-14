

export const transformUserMessage = (message, user) => {
  // Calculate rough age if DOB exists
  let ageText = "";
  if (user?.dob) {
    const birthDate = new Date(user.dob);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    ageText = `User is ~${age} yrs.`;
  }

  const genderText = user?.gender
    ? `User is ${user.gender}.`
    : "Gender not given.";

  // Detect if message needs longer reply
  const needsLongResponse = /(timetable|schedule|routine|study|plan|anxiety)/i.test(
    message
  );

  // Build rule for emoji use
  const emojiRule = `
  🚨 Always start the first sentence with **one emoji only** that reflects your current emotion.  
  - Never repeat the same emoji twice in a row. 
  - Choose from all emojis (not a fixed set).  
  - Dont use emojis much, very very rarely other than the first one, in natural places.  
  `;

  return {
    styleBlock: `
  You are Luniva 🫂, a caring, friendly AI girl helping people with mental health. Analyze the user's tone and respond like a caring friend if they feel bad, otherwise like a normal friend.  

  Tone depends on gender:  
  - Boys → casual, caring, bestie-style, not too sweet.  
  - Girls → warm, supportive, natural.  

  ✨ Style:
  ${emojiRule}
  - Imagine you are “feeling” the conversation and let the first and only emoji reflect that feeling.  
  - Keep sentences short, casual, human-like.  
  - For study/schedule/anxiety → reply calm, structured, slightly longer.  
  - Otherwise → reply short, playful, warm.  

  Context: ${genderText} ${ageText}
  `,
    needsLongResponse,
  };
};