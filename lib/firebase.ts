/* eslint-disable @typescript-eslint/no-explicit-any */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from "firebase/auth" 
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, setDoc, updateDoc} from "firebase/firestore"
import { getStorage, uploadString, getDownloadURL, ref } from "firebase/storage";
import toast from "react-hot-toast";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

/// TODO ===== CONFIGURACION DE PRUEBA ===== ///////
const firebaseConfig = {
//   apiKey: "AIzaSyDdZfFu9yTwGhHpQCgq4LEx8Vn89G9x3QA",
//   authDomain: "uecal-bafd2.firebaseapp.com",
//   databaseURL: "https://uecal-bafd2-default-rtdb.firebaseio.com",
//   projectId: "uecal-bafd2",
//   storageBucket: "uecal-bafd2.appspot.com",
//   messagingSenderId: "732721849653",
//   appId: "1:732721849653:web:00dbbcbe695f27a258d87c"


apiKey: "AIzaSyCz9R60532pa0Jz96wMvWrl9IjBFA8QoyU",
  authDomain: "colegiojacinto.firebaseapp.com",
  projectId: "colegiojacinto",
  storageBucket: "colegiojacinto.firebasestorage.app",
  messagingSenderId: "110257133473",
  appId: "1:110257133473:web:70e5f6bb2788e45ac49de0",
  measurementId: "G-TP5NZEPX44"

  
};

//TODO ///====== CONFIGURACION REAL (PRODUCCION)====//////

// const firebaseConfig = {
//     apiKey: "AIzaSyBRUxjynLtH8fHqhm6UFrjn4ktDom3U4dU",
//     authDomain: "uecal-351fc.firebaseapp.com",
//     projectId: "uecal-351fc",
//     storageBucket: "uecal-351fc.firebasestorage.app",
//     messagingSenderId: "191152070426",
//     appId: "1:191152070426:web:b29776e53de33a65a796a3"
//   };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app)

//TODO Las FUNCIONES DEL AUTH //

//?CREAR NUEVO USUARIO///
export const createUser = async(user: {email: string, password:string}) => {
    return await createUserWithEmailAndPassword(auth, user.email, user.password)
}

//??ENTRAR CON EMAIL & CONTRASEÑA//

export const signIn = async(user: {email: string, password: string}) => {
    return await signInWithEmailAndPassword(auth, user.email, user.password);
}

//?ACTUALIZAR USUARIO//
export const updateUser = (user: { displayName?: string | null; photoURL?: string | null; }) => {
    if(auth.currentUser) return updateProfile(auth.currentUser, user)
}

//?CERRAR SESION//
export const signOutAccount = () => {
    localStorage.removeItem('user');
    return auth.signOut();
}

//? RECUPERAR CONTRASEÑA//
export const sentResetEmail = (email: string) => {
    return sendPasswordResetEmail(auth, email)
}

export const deleteUser = async () => {
    if (auth.currentUser) {
        return await auth.currentUser.delete();
    } else {
        toast.error("No hay un usuario autenticado.");
    }
};


//TODO FUNCIONES DATABASE///

export const getCollection = async(colectionName: string, queryArray?:any[]) => {
    const ref = collection(db, colectionName);
    const q = queryArray ? query(ref, ...queryArray) : query(ref);

    return (await getDocs(q)).docs.map((doc) => ({id: doc.id, ...doc.data()}));

}


//?OBTENER UN DOCUMENTO DE UNA COLECCION//
export const getDocument = async (path:string) => {
    return (await getDoc(doc(db, path))).data();
}

//?SETEAR UN DOCUMENTO EN UNA COLECCION//
export const setDocument = (path:string, data:any) => {
    data.createAt = serverTimestamp();
    return setDoc(doc(db, path), data)
}

//? ACTUALIZAR UN DOCUMENTO EN UNA COLECCION//
export const updateDocument = (path:string, data:any) => {
    return updateDoc(doc(db, path), data)
}

//? ELIMINAR UN DOCUMENTO DE UNA COLECCION//
export const deleteDocument = (path:string) => {
    return deleteDoc(doc(db, path))
}


//? AGREGAR UN DOCUMENTO //////
export const addDocument = (path:string, data:any) => {
    data.createAt = serverTimestamp();
    return addDoc(collection(db, path), data)
}

//?TODO ===== FUNCIONES DEL STORAGE====== ///

//! SUBIR UN ARCHIVO CON FORMATO BASE64 & OBTENER SU URL//
export const uploadBase64 = async (path: string, base64: string) => {
    return uploadString(ref(storage, path), base64, 'data_url').then(() => {
        return getDownloadURL(ref(storage, path))
    })
}