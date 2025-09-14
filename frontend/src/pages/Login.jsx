import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { useLocation } from "react-router-dom";

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);
  const location = useLocation();


  // form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      if (currentState === 'Sign Up') {
        const response = await axios.post(
          `${backendUrl}/api/user/register`,
          { name, email, phone, dob, password }
        );
        if (response.data.success) {
          toast.success('Account created! Please log in.');
          setCurrentState('Login');
        } else {
          toast.error(response.data.message);
        }
      } else {
        const response = await axios.post(
          `${backendUrl}/api/user/login`,
          { email, password }
        );
        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (token) {
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo);
    }
  }, [token, navigate, location]);

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {currentState === 'Sign Up' && (
        <>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Name"
            required
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Phone Number"
            required
          />
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Date of Birth"
            required
          />
        </>
      )}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Email"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Password"
        required
      />

      <div className="w-full flex justify-between text-sm -mt-2">
        <p className="cursor-pointer">Forgot your password?</p>
        {currentState === 'Login' ? (
          <p
            onClick={() => setCurrentState('Sign Up')}
            className="cursor-pointer"
          >
            Create account
          </p>
        ) : (
          <p
            onClick={() => setCurrentState('Login')}
            className="cursor-pointer"
          >
            Have an account? Sign In
          </p>
        )}
      </div>

      <button
        type="submit"
        className="bg-black text-white font-light px-8 py-2 mt-4"
      >
        {currentState === 'Login' ? 'Sign In' : 'Sign Up'}
      </button>

      <GoogleLogin
        onSuccess={(credentialResponse) => {
          axios
            .post(`${backendUrl}/api/user/google`, {
              credential: credentialResponse.credential
            })
            .then((res) => {
              if (res.data.success) {
                setToken(res.data.token);
                localStorage.setItem('token', res.data.token);
              } else {
                toast.error(res.data.message);
              }
            })
            .catch(() => toast.error('Google login failed'));
        }}
        onError={() => {
          toast.error('Google sign-in error');
        }}
      />
    </form>
  );
};

export default Login;
