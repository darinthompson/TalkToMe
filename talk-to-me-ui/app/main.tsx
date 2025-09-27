import { StyleSheet, TouchableOpacity, View,Image} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';

export default function MainScreen() {
  const router = useRouter();

  return (

    <ThemedView style={styles.container}>
      <Image
          source={require('../assets/images/icononly_transparent_nobuffer.png')}
          style={styles.logo}
      />
      <ThemedText type="title" style={styles.title}>Welcome to TalkToMe.AI</ThemedText>
      <ThemedText type="subtitle" style={styles.subtitle}>
        Your personal AI-powered journaling companion.
      </ThemedText>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/journal')}>
            <Image
                source={  require('../assets/images/fulllogo_transparent_nobuffer journal3.png')}
                style={styles.journal}
            />
          {/*<ThemedText style={styles.buttonText}>Write Journal Entry</ThemedText>*/}
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/history')}>
            <Image
                source={  require('../assets/images/fulllogo_transparent_nobuffer mood3.png')}
                style={styles.mood}
            />
          {/*<ThemedText style={styles.buttonText}>View Mood History</ThemedText>*/}
        </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/Chat')}>
              <Image
                  source={  require('../assets/images/fulllogo_transparent_nobuffer chat3.png')}
                  style={styles.chatImage}
                  />
              {/*<ThemedText style={styles.buttonText}>Chat</ThemedText>*/}
          </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/settings')}>
            <Image
                source={  require('../assets/images/fulllogo_transparent_nobuffer settings3.png')}
                style={styles.setting}
            />
          {/*<ThemedText style={styles.buttonText}>Settings</ThemedText>*/}
            </TouchableOpacity>

      </View>
    </ThemedView>

  );
}

const styles = StyleSheet.create({

  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0e0c0c' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#687076', marginBottom: 32, textAlign: 'center' },
  buttonContainer: { gap: 16 ,flexDirection:'row', justifyContent:'center',padding:10},
  button: {width:300,height:300,
    backgroundColor: '#0e0c0c',
    paddingVertical: 16,
    borderRadius: 12,
    alignSelf: 'center',
    alignItems:'center',
    shadowColor: '#0a7ea4',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  logo:
      {
        width:100,
        height:100,
        resizeMode: 'contain',
        marginRight: 600,
        marginBottom: 200,
        marginTop:-130
      },
    chatImage:
        {
            width:300,
            height:250,
            resizeMode:'contain'
        },
    journal:
        {
            width:300,
            height:250,
            resizeMode:'contain'
        },
    mood:
        {
            width:300,
            height:200,
            resizeMode:'contain'
        },
    setting:
        {
            width:300,
            height:200,
            resizeMode:'contain'
        },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 126, 164, 0.8)',},
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
