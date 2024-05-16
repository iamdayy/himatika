import type { TRole } from "~/types";
export const useCanMeRegister = () => {
    const { isAdmin } = useRole();
    const { isDept } = useDept();
    const canMeRegister = (canRegister: TRole) => {
        switch (canRegister) {
            case "All":
                return true;
                break;
            case "No":
                return false;
                break;
            case "Admin":
                if (isAdmin) {
                    return true;
                    break;
                } else {
                    return false;
                    break;
                }
            case "Departement":
                if (isDept) {
                    return true;
                    break;
                } else {
                    return false;
                    break;
                }
            case "Internal":
                if (isAdmin || isDept) {
                    return true;
                    break;
                } else {
                    return false;
                    break;
                }
            case "External":
                if (!isAdmin || !isDept) {
                    return true;
                    break;
                } else {
                    return false;
                    break;
                }
            default:
                return false;
                break;
        }
    }
    return {
        canMeRegister
    }
}