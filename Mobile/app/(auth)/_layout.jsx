import { HeaderShownContext } from "@react-navigation/elements";
import {Stack} from "expo-router";

export default function AuthLayout(){
    return <Stack screenOptions={{headerShown:false}}/>
}