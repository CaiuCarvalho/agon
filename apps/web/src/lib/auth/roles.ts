export function isAdminRole({
  profileRole,
  metadataRole,
}: {
  profileRole?: string | null;
  metadataRole?: unknown;
}) {
  return profileRole === 'admin' || metadataRole === 'admin';
}

