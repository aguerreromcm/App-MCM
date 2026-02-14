import { apiClient, API_CONFIG } from "./api"
import storage from "../utils/storage"

const TIPOS_PAGO_KEY = "tipos_pago_catalogo"

// Tipos de pago por defecto (hardcoded)
const TIPOS_PAGO_DEFAULT = [
    { codigo: "P", descripcion: "PAGO" },
    { codigo: "M", descripcion: "MULTA" }
]

export default {
    getClientesEjecutivo: async () => {
        const token = await storage.getToken()

        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.CLIENTES_EJECUTIVO, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            return {
                success: true,
                data: response.data,
                status: response.status
            }
        } catch (error) {
            console.error("Error al obtener clientes del ejecutivo:", error)
            let errorMessage = "Error de conexión"

            if (error.response) errorMessage = error.response.data?.message || "Error desconocido"

            if (error.response) {
                errorMessage = error.response.data?.message || "Error desconocido"
            } else if (error.request) {
                errorMessage = "Error de conexión. Verifica tu internet"
            }

            return {
                success: false,
                error: errorMessage,
                status: error.response?.status || null
            }
        }
    },

    // Obtener tipos de pago desde la API
    getTiposPago: async function () {
        const token = await storage.getToken()

        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.CATALOGO_TIPOS_PAGO, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data && response.data.tipos_pago) {
                // Guardar en storage local
                await storage.setItem(TIPOS_PAGO_KEY, JSON.stringify(response.data.tipos_pago))

                return {
                    success: true,
                    data: response.data.tipos_pago,
                    status: response.status
                }
            } else {
                throw new Error("Formato de respuesta inválido")
            }
        } catch (error) {
            console.error("Error al obtener tipos de pago:", error)

            // En caso de error, usar tipos de pago desde storage local o por defecto
            const tiposLocal = await this.getTiposPagoLocal()

            return {
                success: false,
                data: tiposLocal,
                error: error.response?.data?.message || error.message || "Error de conexión",
                status: error.response?.status || null
            }
        }
    },

    // Obtener tipos de pago desde storage local
    getTiposPagoLocal: async () => {
        try {
            const tiposString = await storage.getItem(TIPOS_PAGO_KEY)
            if (tiposString) {
                return JSON.parse(tiposString)
            }
        } catch (error) {
            console.error("Error al obtener tipos de pago locales:", error)
        }

        return TIPOS_PAGO_DEFAULT
    },

    inicializarCatalogos: async function () {
        try {
            const resultadoTipos = await this.getTiposPago()

            return {
                success: true,
                tiposPago: resultadoTipos.data,
                actualizadoDesdeAPI: resultadoTipos.success
            }
        } catch (error) {
            console.error("Error al inicializar catálogos:", error)
            const tiposLocal = await this.getTiposPagoLocal()

            return {
                success: false,
                tiposPago: tiposLocal,
                actualizadoDesdeAPI: false,
                error: error.message
            }
        }
    }
}
