// Pinia
import useSetDataStore from "@/stores/setData";
import useSiteDataStore from "@/stores/siteData";
import useStatusDataStore from "@/stores/statusData";
import { useUserStore } from "@/stores/user";

export const setStore = () => useSetDataStore();
export const siteStore = () => useSiteDataStore();
export const statusStore = () => useStatusDataStore();
export const userStore = () => useUserStore();
