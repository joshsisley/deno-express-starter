// deno-lint-ignore-file no-explicit-any
import axios from 'npm:axios';

const facebook = async (access_token:any) => {
  const fields = 'id, name, email, picture';
  const url = 'https://graph.facebook.com/me';
  const params = { access_token, fields };
  const response = await axios.get(url, { params });
  const {
    id, name, email,
  } = response.data;
  return {
    service: 'facebook',
    id,
    name,
    email,
  };
};

const google = async (access_token:any) => {
  const url = 'https://www.googleapis.com/oauth2/v3/userinfo';
  const params = { access_token };
  const response = await axios.get(url, { params });
  const {
    sub, name, email,
  } = response.data;
  return {
    service: 'google',
    id: sub,
    name,
    email,
  };
};

export default {
  facebook,
  google,
};