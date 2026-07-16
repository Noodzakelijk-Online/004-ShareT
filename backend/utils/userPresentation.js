function presentUser(user) {
  if (!user) return null;

  const fallbackName = user.email?.split('@')[0] || 'ShareT user';
  const name = String(user.name || user.fullName || fallbackName).trim() || fallbackName;

  return {
    _id: user._id,
    id: user._id,
    email: user.email,
    name,
    fullName: name,
    role: user.role,
    createdAt: user.createdAt || null,
  };
}

module.exports = { presentUser };
