<script setup>
import { api } from '../../api'
import MailBox from '../../components/MailBox.vue';

const fetchMailUnknowData = async (limit, offset) => {
    return await api.fetch(
        `/admin/mails_unknow`
        + `?limit=${limit}`
        + `&offset=${offset}`
        + `&summary=1`
    );
}

const fetchMailDetail = async (mailId) => {
    return await api.fetch(`/admin/mails/${mailId}`);
}

const deleteMail = async (curMailId) => {
    await api.fetch(`/admin/mails/${curMailId}`, { method: 'DELETE' });
};
</script>

<template>
    <div style="margin-top: 10px;">
        <MailBox :enableUserDeleteEmail="true" :fetchMailData="fetchMailUnknowData"
            :fetchMailDetail="fetchMailDetail" :deleteMail="deleteMail" />
    </div>
</template>
