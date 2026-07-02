// @ts-nocheck
// Lightweight stub for legacy communication side-effects.
// TODO: replace with real integrations (email/SMS/task providers).

const noop = async (payload: any) => {
  if (import.meta.env?.DEV) console.debug('[communicationService stub]', payload);
  return { success: true, id: `stub-${Date.now()}` };
};

export const communicationService = {
  assignTask: noop,
  sendEmail: noop,
  sendSMS: noop,
  scheduleCall: noop,
  sendMail: noop,
};

export default communicationService;
