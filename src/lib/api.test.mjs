import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAuthUser, normalizePermissions } from "./api.ts";

test("normalizeAuthUser unwraps /api/auth/login payload with array permissions", () => {
  const loginData = {
    accessToken: "jwt-token",
    user: {
      id: "user-1",
      nim: "1201220001",
      fullName: "Nadia Putri",
      roleId: "role-2",
      roleName: "Media Kreatif",
      roleCode: "media_kreatif",
      status: "Aktif",
      totalScore: 85,
    },
    permissions: [
      {
        moduleId: "mod-cms",
        moduleCode: "cms",
        moduleLabel: "Web UKM CMS",
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: false,
        canApprove: false,
      },
    ],
  };

  const user = normalizeAuthUser(loginData);
  assert.equal(user.id, "user-1");
  assert.equal(user.nim, "1201220001");
  assert.equal(user.fullName, "Nadia Putri");
  assert.equal(user.roleId, "role-2");
  assert.equal(user.roleName, "Media Kreatif");
  assert.equal(user.roleCode, "media_kreatif");
  assert.equal(user.totalScore, 85);
  assert.deepEqual(user.permissions.cms, {
    read: true,
    create: true,
    update: true,
    delete: false,
    approve: false,
  });
});

test("normalizeAuthUser unwraps /api/auth/me payload with nested user, role, and array permissions", () => {
  const meData = {
    user: {
      id: "user-2",
      nim: "1201220099",
      fullName: "Budi Santoso",
      roleId: "role-1",
      roleName: "Admin",
      status: "Aktif",
      prodi: "S1 Sistem Informasi",
    },
    role: {
      id: "role-1",
      name: "Admin",
    },
    permissions: [
      {
        moduleCode: "cms",
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canApprove: true,
      },
    ],
    totalScore: 120,
  };

  const user = normalizeAuthUser(meData);
  assert.equal(user.id, "user-2");
  assert.equal(user.fullName, "Budi Santoso");
  assert.equal(user.roleName, "Admin");
  assert.equal(user.roleCode, "admin");
  assert.equal(user.prodi, "S1 Sistem Informasi");
  assert.equal(user.totalScore, 120);
  assert.deepEqual(user.permissions.cms, {
    read: true,
    create: true,
    update: true,
    delete: true,
    approve: true,
  });
});

test("normalizeAuthUser supports flat user and keyed Record<string, PermissionEntry>", () => {
  const flatPayload = {
    id: "user-3",
    nim: "1201220003",
    fullName: "Raka Pratama",
    roleId: "role-3",
    roleName: "Pengurus",
    status: "Aktif",
    permissions: {
      cms: {
        read: true,
        create: false,
        update: true,
        delete: false,
        approve: false,
      },
    },
  };

  const user = normalizeAuthUser(flatPayload);
  assert.equal(user.roleName, "Pengurus");
  assert.equal(user.roleCode, "pengurus");
  assert.deepEqual(user.permissions.cms, {
    read: true,
    create: false,
    update: true,
    delete: false,
    approve: false,
  });
});

test("normalizeAuthUser uses role.name fallback when user.roleName is missing", () => {
  const payload = {
    user: {
      id: "user-4",
      nim: "1201220004",
      fullName: "Sari Dewi",
      roleName: "",
      status: "Aktif",
      permissions: {
        cms: { canRead: true, canUpdate: false },
      },
    },
    role: {
      id: "role-4",
      name: "Sekretaris Umum",
    },
  };

  const user = normalizeAuthUser(payload);
  assert.equal(user.roleId, "role-4");
  assert.equal(user.roleName, "Sekretaris Umum");
  assert.equal(user.roleCode, "sekretaris_umum");
  assert.deepEqual(user.permissions.cms, {
    read: true,
    create: false,
    update: false,
    delete: false,
    approve: false,
  });
});

test("normalizePermissions handles empty, null, undefined, and malformed inputs safely", () => {
  assert.deepEqual(normalizePermissions(null), {});
  assert.deepEqual(normalizePermissions(undefined), {});
  assert.deepEqual(normalizePermissions([]), {});
  assert.deepEqual(
    normalizePermissions([
      { moduleCode: "", canRead: true },
      { canRead: true },
      { moduleCode: "cms", canRead: true },
    ]),
    {
      cms: {
        read: true,
        create: false,
        update: false,
        delete: false,
        approve: false,
      },
    }
  );
});

test("normalizeAuthUser rejects invalid or empty payloads", () => {
  assert.throws(() => normalizeAuthUser(null), /tidak valid/);
  assert.throws(() => normalizeAuthUser({}), /tidak valid/);
  assert.throws(() => normalizeAuthUser({ user: {} }), /tidak valid/);
});
