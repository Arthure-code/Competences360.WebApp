import type { AdminUser } from "@/types/adminUser"

/**
 * Un seul compte de départ, codé en dur, toujours Propriétaire ET Racine
 * (voir AdminUser.isOwner/isRoot) — c'est lui qui pourra ensuite créer
 * les autres comptes admin, décider lesquels sont Propriétaires, et
 * désigner d'autres comptes racine.
 */
export function getAdminUsersSeed(): AdminUser[] {
    return [
        {
            id: "admin-1",
            firstName: "Laurie",
            lastName: "Deschamps",
            email: "admin@competences360.com",
            isActive: true,
            createdAt: new Date().toISOString(),
            isOwner: true,
            hasChangedPassword: true,
            isRoot: true,
        },
    ]
}