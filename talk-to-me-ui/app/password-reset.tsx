// import { ThemedText } from '@/components/ThemedText';
// import React from 'react';
// import { Platform, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
// import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';



// const PasswordReset = () => {

    
//     const colorScheme = useColorScheme();
//     const isDark = colorScheme === 'dark';
    
//     return(

//     );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', padding: 32, alignItems: 'center', backgroundColor: '#f7f8fa' },
//   title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
//   subtitle: { fontSize: 18, color: '#687076', marginBottom: 32, textAlign: 'center' },
//   buttonContainer: { gap: 16 },
//   button: {
//     backgroundColor: '#0a7ea4',
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     shadowColor: '#0a7ea4',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
// });

// export default PasswordReset;


import {
  FormControl,
  FormControlLabel,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { AlertCircleIcon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import React from 'react';
import { Center } from '@/components/ui/center';
import { Card } from '@/components/ui/card';
import { Platform } from 'react-native';

const PasswordReset = () => {
  const [isInvalid, setIsInvalid] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [inputConfirm, setInputConfirm] = React.useState('');

  const API_BASE =
  Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_API_BASE_ANDROID || 'http://10.0.2.2:3001'
    : Platform.OS === 'web'
    ? process.env.EXPO_PUBLIC_API_BASE_WEB || 'http://localhost:3000'
    : process.env.EXPO_PUBLIC_API_BASE_IOS || 'http://127.0.0.1:3001';

  const handleSubmit = async () => {
    console.log('PASSWORD: ', inputValue);
    console.log('CONFIRM: ', inputConfirm);
  };

  return (

    <Center className="h-[450px] w-[650px]">
      <Card className='p-5 rounded-lg max-x-[600]'>
        <FormControl
          isInvalid={isInvalid}
          size="md"
          isDisabled={false}
          isReadOnly={false}
          isRequired={false}
        >
          <FormControlLabel>
            <FormControlLabelText>Forgot your password?</FormControlLabelText>
          </FormControlLabel>
          <Input
            variant="outline"
            size="sm"
            isDisabled={false}
            isInvalid={false}
            isReadOnly={false}
          >
          <InputField
            type="password"
            placeholder="password"
            value={inputValue}
            onChangeText={(text) => setInputValue(text)}
          />
          </Input>
          <Input
            variant="outline"
            size="sm"
            isDisabled={false}
            isInvalid={false}
            isReadOnly={false}
          >
          <InputField
            type="password"
            placeholder="Confirm Password "
            value={inputConfirm}
            onChangeText={(text) => setInputConfirm(text)}
          />
          </Input>
        </FormControl>
        <Button
          className="w-fit self-end mt-4"
          size="sm"
          variant="outline"
          onPress={handleSubmit}
        >
          <ButtonText>Reset Your Password</ButtonText>
        </Button>
      </Card>
    </Center>
  );
}

export default PasswordReset;

function handleSubmit() {
  throw new Error('Function not implemented.');
}
