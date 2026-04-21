import { View, Text, Pressable, ScrollView } from "react-native"
import { Feather } from "@expo/vector-icons"
import CustomAlert from "./CustomAlert"
import { useCustomAlert } from "../hooks/useCustomAlert"

export default function Mensajes() {
    const { alertRef, showSuccess, showError, showWarning, showInfo, showSimple } = useCustomAlert()

    // Función para mostrar diferentes tipos de alertas
    const handleSuccessAlert = () => {
        showSuccess("¡Éxito!", "La operación se completó correctamente.", [
            {
                text: "Genial",
                onPress: () => console.log("Success confirmed"),
                style: "default"
            }
        ])
    }

    const handleErrorAlert = () => {
        showError("Error", "Algo salió mal. Por favor, inténtalo de nuevo.", [
            {
                text: "Reintentar",
                onPress: () => console.log("Retry pressed"),
                style: "default"
            },
            {
                text: "Cancelar",
                onPress: () => console.log("Cancel pressed"),
                style: "cancel"
            }
        ])
    }

    const handleWarningAlert = () => {
        showWarning("Advertencia", "Esta acción no se puede deshacer. ¿Estás seguro?", [
            {
                text: "Continuar",
                onPress: () => console.log("Continue pressed"),
                style: "destructive"
            },
            {
                text: "Cancelar",
                onPress: () => console.log("Cancel pressed"),
                style: "cancel"
            }
        ])
    }

    const handleInfoAlert = () => {
        showInfo(
            "Información",
            "Esta es una información importante que debes conocer antes de continuar."
        )
    }

    const handleSimpleAlert = () => {
        showSimple("Mensaje", "Este es un mensaje simple sin iconos especiales.")
    }

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView className="flex-1 p-4">
                <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Prueba de Alertas Personalizadas
                </Text>

                <View className="space-y-4">
                    {/* Alerta de Éxito */}
                    <Pressable
                        onPress={handleSuccessAlert}
                        className="bg-green-500 rounded-xl p-4 flex-row items-center"
                    >
                        <Feather name="check-circle" size={24} color="white" />
                        <Text className="text-white font-semibold text-base ml-3">
                            Mostrar Alerta de Éxito
                        </Text>
                    </Pressable>

                    {/* Alerta de Error */}
                    <Pressable
                        onPress={handleErrorAlert}
                        className="bg-red-500 rounded-xl p-4 flex-row items-center"
                    >
                        <Feather name="x-circle" size={24} color="white" />
                        <Text className="text-white font-semibold text-base ml-3">
                            Mostrar Alerta de Error
                        </Text>
                    </Pressable>

                    {/* Alerta de Advertencia */}
                    <Pressable
                        onPress={handleWarningAlert}
                        className="bg-yellow-500 rounded-xl p-4 flex-row items-center"
                    >
                        <Feather name="alert-triangle" size={24} color="white" />
                        <Text className="text-white font-semibold text-base ml-3">
                            Mostrar Alerta de Advertencia
                        </Text>
                    </Pressable>

                    {/* Alerta de Información */}
                    <Pressable
                        onPress={handleInfoAlert}
                        className="bg-blue-500 rounded-xl p-4 flex-row items-center"
                    >
                        <Feather name="info" size={24} color="white" />
                        <Text className="text-white font-semibold text-base ml-3">
                            Mostrar Alerta de Información
                        </Text>
                    </Pressable>

                    {/* Alerta Simple */}
                    <Pressable
                        onPress={handleSimpleAlert}
                        className="bg-gray-600 rounded-xl p-4 flex-row items-center"
                    >
                        <Feather name="message-circle" size={24} color="white" />
                        <Text className="text-white font-semibold text-base ml-3">
                            Mostrar Alerta Simple
                        </Text>
                    </Pressable>
                </View>

                {/* Instrucciones */}
                <View className="mt-8 p-4 bg-white rounded-xl">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">
                        Tipos de Alerta Disponibles:
                    </Text>
                    <Text className="text-sm text-gray-600 leading-5">
                        • <Text className="font-medium">Éxito:</Text> Para operaciones completadas
                        {"\n"}• <Text className="font-medium">Error:</Text> Para errores y fallos
                        {"\n"}• <Text className="font-medium">Advertencia:</Text> Para acciones
                        destructivas{"\n"}• <Text className="font-medium">Información:</Text> Para
                        mensajes informativos{"\n"}• <Text className="font-medium">Simple:</Text>{" "}
                        Para mensajes básicos
                    </Text>
                </View>
            </ScrollView>

            {/* Componente de Alerta */}
            <CustomAlert ref={alertRef} />
        </View>
    )
}
